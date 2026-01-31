"""
Supabase Data Export Module

Exports training data from Supabase for ML model training.
Uses the feature engineering views defined in the database migrations.
"""

import os
from datetime import datetime, timedelta
from typing import Optional

import pandas as pd
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()


def get_supabase_client() -> Client:
    """Create an authenticated Supabase client using service role key."""
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise ValueError(
            "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment"
        )
    return create_client(url, key)


def export_pass_prediction_features(
    client: Optional[Client] = None,
    min_attempts: int = 3,
    output_path: Optional[str] = None,
) -> pd.DataFrame:
    """
    Export pass prediction features from the ml_pass_prediction_features view.

    Args:
        client: Supabase client (created if not provided)
        min_attempts: Minimum attempts per user to include (filters sparse data)
        output_path: If provided, saves CSV to this path

    Returns:
        DataFrame with features for pass prediction model
    """
    client = client or get_supabase_client()

    response = client.rpc("get_pass_prediction_features", {}).execute()
    if not response.data:
        # Fallback: query the view directly
        response = client.table("ml_pass_prediction_features").select("*").execute()

    df = pd.DataFrame(response.data)

    if df.empty:
        return df

    # Filter users with minimum attempts
    user_counts = df["user_id"].value_counts()
    valid_users = user_counts[user_counts >= min_attempts].index
    df = df[df["user_id"].isin(valid_users)]

    # Fill NaN theta_delta for first attempts
    df["theta_delta"] = df["theta_delta"].fillna(0)

    # Fill NaN percentages
    pct_cols = [
        "clinica_medica_pct",
        "cirurgia_pct",
        "gine_pct",
        "pediatria_pct",
        "saude_pct",
    ]
    for col in pct_cols:
        df[col] = df[col].fillna(0)

    if output_path:
        df.to_csv(output_path, index=False)
        print(f"Exported {len(df)} rows to {output_path}")

    return df


def export_irt_item_responses(
    client: Optional[Client] = None,
    days_back: int = 365,
    output_path: Optional[str] = None,
) -> pd.DataFrame:
    """
    Export item response data for IRT parameter estimation.

    Args:
        client: Supabase client
        days_back: Only include responses from the last N days
        output_path: If provided, saves CSV to this path

    Returns:
        DataFrame with user_id, question_id, correct, response_time_ms
    """
    client = client or get_supabase_client()
    since = (datetime.utcnow() - timedelta(days=days_back)).isoformat()

    # Query exam_attempt_responses (responses are stored with each attempt)
    # This assumes a join table or denormalized responses exist
    response = (
        client.table("exam_attempts")
        .select("id, user_id, responses, started_at")
        .gte("started_at", since)
        .not_.is_("responses", "null")
        .execute()
    )

    if not response.data:
        return pd.DataFrame()

    # Flatten responses JSONB into rows
    rows = []
    for attempt in response.data:
        user_id = attempt["user_id"]
        responses = attempt.get("responses") or {}
        for question_id, resp in responses.items():
            rows.append(
                {
                    "user_id": user_id,
                    "question_id": question_id,
                    "correct": resp.get("correct", False),
                    "response_time_ms": resp.get("time_ms"),
                }
            )

    df = pd.DataFrame(rows)

    if output_path and not df.empty:
        df.to_csv(output_path, index=False)
        print(f"Exported {len(df)} item responses to {output_path}")

    return df


def export_knowledge_states(
    client: Optional[Client] = None,
    output_path: Optional[str] = None,
) -> pd.DataFrame:
    """
    Export knowledge state data for BKT model training.

    Args:
        client: Supabase client
        output_path: If provided, saves CSV to this path

    Returns:
        DataFrame with user_id, topic, mastery_probability, response_count
    """
    client = client or get_supabase_client()

    response = client.table("knowledge_states").select("*").execute()
    df = pd.DataFrame(response.data) if response.data else pd.DataFrame()

    if output_path and not df.empty:
        df.to_csv(output_path, index=False)
        print(f"Exported {len(df)} knowledge states to {output_path}")

    return df


def export_flashcard_reviews(
    client: Optional[Client] = None,
    days_back: int = 180,
    output_path: Optional[str] = None,
) -> pd.DataFrame:
    """
    Export flashcard review history for spaced repetition analysis.

    Args:
        client: Supabase client
        days_back: Only include reviews from the last N days
        output_path: If provided, saves CSV to this path

    Returns:
        DataFrame with review history including quality ratings and intervals
    """
    client = client or get_supabase_client()
    since = (datetime.utcnow() - timedelta(days=days_back)).isoformat()

    response = (
        client.table("flashcard_reviews")
        .select(
            "id, user_id, flashcard_id, quality, reviewed_at, "
            "ease_factor_before, ease_factor_after, interval_before, interval_after"
        )
        .gte("reviewed_at", since)
        .execute()
    )

    df = pd.DataFrame(response.data) if response.data else pd.DataFrame()

    if output_path and not df.empty:
        df.to_csv(output_path, index=False)
        print(f"Exported {len(df)} flashcard reviews to {output_path}")

    return df


def export_all_training_data(output_dir: str = "data/exports") -> dict[str, str]:
    """
    Export all training datasets to the specified directory.

    Args:
        output_dir: Directory to save CSV files

    Returns:
        Dictionary mapping dataset name to file path
    """
    os.makedirs(output_dir, exist_ok=True)
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")

    client = get_supabase_client()
    exports = {}

    # Pass prediction features
    path = f"{output_dir}/pass_features_{timestamp}.csv"
    df = export_pass_prediction_features(client, output_path=path)
    if not df.empty:
        exports["pass_prediction"] = path

    # IRT item responses
    path = f"{output_dir}/irt_responses_{timestamp}.csv"
    df = export_irt_item_responses(client, output_path=path)
    if not df.empty:
        exports["irt_responses"] = path

    # Knowledge states
    path = f"{output_dir}/knowledge_states_{timestamp}.csv"
    df = export_knowledge_states(client, output_path=path)
    if not df.empty:
        exports["knowledge_states"] = path

    # Flashcard reviews
    path = f"{output_dir}/flashcard_reviews_{timestamp}.csv"
    df = export_flashcard_reviews(client, output_path=path)
    if not df.empty:
        exports["flashcard_reviews"] = path

    print(f"\nExported {len(exports)} datasets to {output_dir}")
    return exports


if __name__ == "__main__":
    export_all_training_data()
