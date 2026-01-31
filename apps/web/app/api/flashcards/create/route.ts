import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

interface CreateFlashcardRequest {
  front: string
  back: string
  deckId?: string
  area?: string
  subspecialty?: string
  topic?: string
  questionId?: string
  tags?: string[]
}

/**
 * POST /api/flashcards/create
 * Create a new flashcard (auto-assigns to user's default deck or creates one)
 *
 * Body: {
 *   front: string (required)
 *   back: string (required)
 *   deckId?: string (optional, uses "Erros de Simulado" deck if not provided)
 *   area?: string (ENAMED area)
 *   subspecialty?: string
 *   topic?: string
 *   questionId?: string (reference to original question)
 *   tags?: string[]
 * }
 *
 * Returns: { id: string, deckId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json() as CreateFlashcardRequest
    const { front, back, deckId, area, subspecialty, topic, questionId, tags } = body

    if (!front || !back) {
      return NextResponse.json(
        { error: 'front and back are required' },
        { status: 400 }
      )
    }

    let targetDeckId = deckId

    // If no deckId provided, find or create "Erros de Simulado" deck
    if (!targetDeckId) {
      const { data: existingDeck } = await supabase
        .from('flashcard_decks')
        .select('id')
        .eq('user_id', user.id)
        .eq('name', 'Erros de Simulado')
        .maybeSingle<{ id: string }>()

      if (existingDeck) {
        targetDeckId = existingDeck.id
      } else {
        // Create the deck
        const { data: newDeck, error: deckError } = await supabase
          .from('flashcard_decks')
          .insert({
            user_id: user.id,
            name: 'Erros de Simulado',
            description: 'Questões que errei nos simulados',
            is_public: false,
          } as any)
          .select('id')
          .single<{ id: string }>()

        if (deckError || !newDeck) {
          console.error('Error creating deck:', deckError)
          return NextResponse.json(
            { error: 'Failed to create deck' },
            { status: 500 }
          )
        }

        targetDeckId = newDeck.id
      }
    }

    // Check if flashcard already exists for this question
    if (questionId) {
      const { data: existing } = await supabase
        .from('flashcards')
        .select('id')
        .eq('deck_id', targetDeckId)
        .eq('question_id', questionId)
        .maybeSingle<{ id: string }>()

      if (existing) {
        return NextResponse.json({
          id: existing.id,
          deckId: targetDeckId,
          message: 'Flashcard já existe para esta questão',
        })
      }
    }

    // Create flashcard
    const { data: flashcard, error: cardError } = await supabase
      .from('flashcards')
      .insert({
        deck_id: targetDeckId,
        front,
        back,
        area,
        subspecialty,
        topic,
        question_id: questionId,
        tags: tags || [],
      } as any)
      .select('id')
      .single<{ id: string }>()

    if (cardError || !flashcard) {
      console.error('Error creating flashcard:', cardError)
      return NextResponse.json(
        { error: 'Failed to create flashcard' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      id: flashcard.id,
      deckId: targetDeckId,
      message: 'Flashcard criado com sucesso',
    }, { status: 201 })
  } catch (error) {
    console.error('Create flashcard API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
