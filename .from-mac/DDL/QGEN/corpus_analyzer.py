"""
QGen-DDL Corpus Analyzer
=========================
Pipeline for ingesting, parsing, and analyzing medical exam question corpora.
Supports ENAMED, ENARE, institutional exams, and commercial question banks.

Author: Demetrios Chiuratto Agourakis
Project: DARWIN / QGen-DDL
Version: 1.0.0
"""

import re
import json
import hashlib
from pathlib import Path
from typing import List, Dict, Tuple, Optional, Any
from dataclasses import dataclass, field
from collections import Counter, defaultdict
import logging

logger = logging.getLogger(__name__)

# Try imports, handle gracefully
try:
    import numpy as np
    import pandas as pd
    from scipy import stats as scipy_stats
except ImportError:
    logger.warning("numpy/pandas/scipy not available. Install: pip install numpy pandas scipy")

try:
    from sentence_transformers import SentenceTransformer
except ImportError:
    logger.warning("sentence-transformers not available. Install: pip install sentence-transformers")


# ============================================================
# RAW QUESTION PARSER
# ============================================================

@dataclass
class RawQuestion:
    """Questão bruta extraída do corpus antes de feature extraction."""
    id: str
    source: str
    year: int
    question_number: Optional[int]
    full_text: str                          # texto completo original
    stem: str                               # enunciado (sem alternativas)
    alternatives: Dict[str, str]            # {"A": "...", "B": "...", ...}
    correct_answer: str                     # "A", "B", "C", "D", "E"
    commentary: Optional[str] = None        # comentário/resolução
    image_paths: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)
    hash: str = ""                          # para deduplicação
    
    def __post_init__(self):
        if not self.hash:
            content = f"{self.stem}{''.join(self.alternatives.values())}"
            self.hash = hashlib.md5(content.encode()).hexdigest()


class QuestionParser:
    """
    Parser multiformat para questões médicas.
    Suporta formatos comuns de bancos de questões brasileiros.
    """
    
    # Padrões regex para identificar alternativas
    ALT_PATTERNS = [
        # (A) texto / (B) texto
        r'\(([A-E])\)\s*(.+?)(?=\([A-E]\)|$)',
        # a) texto / b) texto
        r'([a-e])\)\s*(.+?)(?=[a-e]\)|$)',
        # A. texto / B. texto
        r'([A-E])\.\s*(.+?)(?=[A-E]\.|$)',
        # A - texto / B - texto
        r'([A-E])\s*[-–—]\s*(.+?)(?=[A-E]\s*[-–—]|$)',
    ]
    
    # Padrões para identificar gabarito
    ANSWER_PATTERNS = [
        r'[Gg]abarito[:\s]*\(?([A-Ea-e])\)?',
        r'[Rr]esposta[:\s]*\(?([A-Ea-e])\)?',
        r'[Aa]lternativa\s+correta[:\s]*\(?([A-Ea-e])\)?',
        r'GABARITO[:\s]*([A-E])',
    ]
    
    @staticmethod
    def parse_text_block(text: str, source: str = "unknown", year: int = 0) -> Optional[RawQuestion]:
        """
        Parse um bloco de texto contendo uma questão.
        Tenta múltiplos formatos de parsing.
        """
        text = text.strip()
        if not text:
            return None
        
        # Tentar extrair alternativas
        alternatives = {}
        stem = text
        
        for pattern in QuestionParser.ALT_PATTERNS:
            matches = re.findall(pattern, text, re.DOTALL)
            if len(matches) >= 4:  # mínimo 4 alternativas
                alternatives = {m[0].upper(): m[1].strip() for m in matches}
                # Extrair enunciado (tudo antes da primeira alternativa)
                first_alt_match = re.search(pattern, text)
                if first_alt_match:
                    stem = text[:first_alt_match.start()].strip()
                break
        
        if not alternatives:
            logger.warning(f"Could not parse alternatives from text block")
            return None
        
        # Extrair gabarito
        correct = ""
        for pattern in QuestionParser.ANSWER_PATTERNS:
            match = re.search(pattern, text)
            if match:
                correct = match.group(1).upper()
                break
        
        # Extrair comentário (tudo depois do gabarito)
        commentary = None
        for pattern in QuestionParser.ANSWER_PATTERNS:
            match = re.search(pattern, text)
            if match:
                post_answer = text[match.end():].strip()
                if post_answer:
                    commentary = post_answer
                break
        
        return RawQuestion(
            id=f"{source}_{year}_{hashlib.md5(stem.encode()).hexdigest()[:8]}",
            source=source,
            year=year,
            question_number=None,
            full_text=text,
            stem=stem,
            alternatives=alternatives,
            correct_answer=correct,
            commentary=commentary,
        )
    
    @staticmethod
    def parse_json_batch(filepath: str) -> List[RawQuestion]:
        """
        Parse arquivo JSON com batch de questões.
        Formato esperado:
        [
            {
                "question": "...",
                "alternatives": {"A": "...", ...},
                "answer": "C",
                "source": "ENAMED",
                "year": 2024,
                ...
            }
        ]
        """
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        questions = []
        for i, item in enumerate(data):
            try:
                q = RawQuestion(
                    id=item.get('id', f"batch_{i}"),
                    source=item.get('source', 'unknown'),
                    year=item.get('year', 0),
                    question_number=item.get('number'),
                    full_text=item.get('full_text', item.get('question', '')),
                    stem=item.get('question', item.get('stem', '')),
                    alternatives=item.get('alternatives', {}),
                    correct_answer=item.get('answer', item.get('correct', '')),
                    commentary=item.get('commentary', item.get('explanation', None)),
                    metadata=item.get('metadata', {}),
                )
                questions.append(q)
            except Exception as e:
                logger.error(f"Failed to parse item {i}: {e}")
        
        return questions
    
    @staticmethod
    def parse_csv_batch(filepath: str) -> List[RawQuestion]:
        """Parse arquivo CSV com questões."""
        df = pd.read_csv(filepath, encoding='utf-8')
        
        questions = []
        for i, row in df.iterrows():
            alts = {}
            for letter in ['A', 'B', 'C', 'D', 'E']:
                col_name = f'alt_{letter.lower()}'
                if col_name in row and pd.notna(row[col_name]):
                    alts[letter] = str(row[col_name])
            
            q = RawQuestion(
                id=row.get('id', f"csv_{i}"),
                source=row.get('source', 'unknown'),
                year=int(row.get('year', 0)),
                question_number=row.get('number'),
                full_text=str(row.get('full_text', row.get('stem', ''))),
                stem=str(row.get('stem', row.get('question', ''))),
                alternatives=alts,
                correct_answer=str(row.get('answer', row.get('correct', ''))).upper(),
                commentary=row.get('commentary') if pd.notna(row.get('commentary')) else None,
            )
            questions.append(q)
        
        return questions


# ============================================================
# CORPUS STATISTICS
# ============================================================

class CorpusAnalyzer:
    """
    Analisa corpus de questões e extrai estatísticas globais.
    """
    
    def __init__(self, questions: List[RawQuestion]):
        self.questions = questions
        self.n = len(questions)
        logger.info(f"CorpusAnalyzer initialized with {self.n} questions")
    
    def basic_statistics(self) -> Dict[str, Any]:
        """Estatísticas descritivas básicas do corpus."""
        stats = {
            "total_questions": self.n,
            "sources": Counter(q.source for q in self.questions),
            "years": Counter(q.year for q in self.questions),
            "has_commentary": sum(1 for q in self.questions if q.commentary),
            "has_correct_answer": sum(1 for q in self.questions if q.correct_answer),
            "num_alternatives_dist": Counter(len(q.alternatives) for q in self.questions),
        }
        
        # Distribuição do tamanho do enunciado
        stem_lengths = [len(q.stem.split()) for q in self.questions]
        stats["stem_length"] = {
            "mean": np.mean(stem_lengths),
            "std": np.std(stem_lengths),
            "median": np.median(stem_lengths),
            "min": np.min(stem_lengths),
            "max": np.max(stem_lengths),
            "q25": np.percentile(stem_lengths, 25),
            "q75": np.percentile(stem_lengths, 75),
        }
        
        # Distribuição do tamanho das alternativas
        alt_lengths = []
        for q in self.questions:
            for alt in q.alternatives.values():
                alt_lengths.append(len(alt.split()))
        
        stats["alternative_length"] = {
            "mean": np.mean(alt_lengths),
            "std": np.std(alt_lengths),
            "median": np.median(alt_lengths),
        }
        
        # Distribuição da posição da resposta correta
        correct_positions = Counter(q.correct_answer for q in self.questions if q.correct_answer)
        stats["correct_answer_dist"] = dict(correct_positions)
        
        return stats
    
    def linguistic_analysis(self) -> Dict[str, Any]:
        """Análise linguística do corpus."""
        results = {
            "negative_questions": 0,
            "negative_patterns": Counter(),
            "hedging_markers": Counter(),
            "absolute_terms": Counter(),
            "question_types": Counter(),
        }
        
        # Padrões negativos
        neg_patterns = [
            (r'\bNÃO\b', 'NÃO'),
            (r'\bEXCETO\b', 'EXCETO'),
            (r'\bINCORRETA?\b', 'INCORRETA'),
            (r'\bINADEQUAD[AO]\b', 'INADEQUADO'),
        ]
        
        # Hedging markers
        hedging = [
            r'\bpode\b', r'\bpossível\b', r'\bprovável\b',
            r'\bgeralmente\b', r'\bfrequentemente\b', r'\bmais\s+comum\b',
            r'\bprincipal\b', r'\bhabitualmente\b',
        ]
        
        # Termos absolutos
        absolutes = [
            r'\bsempre\b', r'\bnunca\b', r'\búnico\b',
            r'\btodos?\b', r'\bnenhu[mn]\b', r'\bobrigatoriamente\b',
            r'\bexclusivamente\b', r'\binvariavel\b',
        ]
        
        for q in self.questions:
            text = q.stem + ' ' + ' '.join(q.alternatives.values())
            text_lower = text.lower()
            
            # Negativos
            for pattern, label in neg_patterns:
                if re.search(pattern, q.stem):
                    results["negative_questions"] += 1
                    results["negative_patterns"][label] += 1
                    break
            
            # Hedging
            for pattern in hedging:
                count = len(re.findall(pattern, text_lower))
                if count > 0:
                    results["hedging_markers"][pattern.strip(r'\b')] += count
            
            # Absolutos
            for pattern in absolutes:
                count = len(re.findall(pattern, text_lower))
                if count > 0:
                    results["absolute_terms"][pattern.strip(r'\b')] += count
        
        results["negative_question_rate"] = results["negative_questions"] / self.n
        
        return results
    
    def correct_answer_analysis(self) -> Dict[str, Any]:
        """Análise da distribuição de respostas corretas."""
        positions = [q.correct_answer for q in self.questions if q.correct_answer]
        
        if not positions:
            return {"warning": "No correct answers available"}
        
        dist = Counter(positions)
        n = len(positions)
        
        # Chi-squared test against uniform distribution
        observed = [dist.get(letter, 0) for letter in 'ABCDE' if letter in dist]
        expected = [n / len(observed)] * len(observed)
        chi2, p_value = scipy_stats.chisquare(observed, expected)
        
        # Análise por posição da correta vs. tamanho da alternativa
        correct_lengths = []
        incorrect_lengths = []
        for q in self.questions:
            if q.correct_answer and q.correct_answer in q.alternatives:
                correct_text = q.alternatives[q.correct_answer]
                correct_lengths.append(len(correct_text.split()))
                for letter, text in q.alternatives.items():
                    if letter != q.correct_answer:
                        incorrect_lengths.append(len(text.split()))
        
        return {
            "distribution": dict(dist),
            "chi2_uniform": {"statistic": chi2, "p_value": p_value},
            "is_uniform": p_value > 0.05,
            "correct_length": {
                "mean": np.mean(correct_lengths) if correct_lengths else 0,
                "std": np.std(correct_lengths) if correct_lengths else 0,
            },
            "incorrect_length": {
                "mean": np.mean(incorrect_lengths) if incorrect_lengths else 0,
                "std": np.std(incorrect_lengths) if incorrect_lengths else 0,
            },
            "length_bias": (np.mean(correct_lengths) - np.mean(incorrect_lengths)) 
                          if correct_lengths and incorrect_lengths else 0,
        }
    
    def deduplication(self, threshold: float = 0.85) -> Tuple[List[RawQuestion], List[Tuple[str, str]]]:
        """
        Identifica e remove questões duplicadas ou muito similares.
        Usa hash MD5 para duplicatas exatas e embeddings para similares.
        """
        # Fase 1: Duplicatas exatas (hash)
        seen_hashes = {}
        exact_dupes = []
        unique = []
        
        for q in self.questions:
            if q.hash in seen_hashes:
                exact_dupes.append((q.id, seen_hashes[q.hash]))
            else:
                seen_hashes[q.hash] = q.id
                unique.append(q)
        
        logger.info(f"Exact duplicates removed: {len(exact_dupes)}")
        
        # Fase 2: Similaridade semântica (se sentence-transformers disponível)
        semantic_dupes = []
        try:
            model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
            stems = [q.stem for q in unique]
            embeddings = model.encode(stems, show_progress_bar=True)
            
            from sklearn.metrics.pairwise import cosine_similarity
            sim_matrix = cosine_similarity(embeddings)
            
            to_remove = set()
            for i in range(len(unique)):
                if i in to_remove:
                    continue
                for j in range(i + 1, len(unique)):
                    if j in to_remove:
                        continue
                    if sim_matrix[i][j] > threshold:
                        semantic_dupes.append((unique[i].id, unique[j].id))
                        to_remove.add(j)
            
            unique = [q for i, q in enumerate(unique) if i not in to_remove]
            logger.info(f"Semantic near-duplicates removed: {len(semantic_dupes)}")
            
        except Exception as e:
            logger.warning(f"Semantic dedup skipped: {e}")
        
        all_dupes = exact_dupes + semantic_dupes
        logger.info(f"Final corpus: {len(unique)} unique questions")
        
        return unique, all_dupes
    
    def generate_report(self) -> Dict[str, Any]:
        """Gera relatório completo do corpus."""
        return {
            "basic": self.basic_statistics(),
            "linguistic": self.linguistic_analysis(),
            "correct_answer": self.correct_answer_analysis(),
            "timestamp": pd.Timestamp.now().isoformat(),
        }
    
    def export_report(self, filepath: str):
        """Exporta relatório para JSON."""
        report = self.generate_report()
        
        # Convert numpy types for JSON serialization
        def convert(obj):
            if isinstance(obj, (np.integer,)):
                return int(obj)
            elif isinstance(obj, (np.floating,)):
                return float(obj)
            elif isinstance(obj, np.ndarray):
                return obj.tolist()
            elif isinstance(obj, Counter):
                return dict(obj)
            return obj
        
        import json
        
        def deep_convert(obj):
            if isinstance(obj, dict):
                return {k: deep_convert(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [deep_convert(i) for i in obj]
            return convert(obj)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(deep_convert(report), f, ensure_ascii=False, indent=2)
        
        logger.info(f"Report exported to {filepath}")
