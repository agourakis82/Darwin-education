'use client'

import type { CIPImageCase } from '@darwin-education/shared'
import { IMAGE_MODALITY_LABELS_PT } from '@darwin-education/shared'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

interface ImageCaseViewerProps {
  imageCase: CIPImageCase
  showDescription?: boolean
}

export function ImageCaseViewer({
  imageCase,
  showDescription = true,
}: ImageCaseViewerProps) {
  const modalityLabel =
    IMAGE_MODALITY_LABELS_PT[imageCase.modality] || imageCase.modality

  return (
    <div className="space-y-4">
      {/* Clinical Context */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Contexto Clínico</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {imageCase.clinicalContextPt}
          </p>
        </CardContent>
      </Card>

      {/* Image Display */}
      {showDescription && (
        <Card className="bg-gray-950 border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-gray-200 flex items-center gap-2">
              <span className="text-lg">🖼️</span>
              Exame de Imagem — {modalityLabel}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* ASCII Art for EKG */}
            {imageCase.asciiArt && (
              <div className="mb-4 overflow-x-auto">
                <pre className="text-green-400 text-xs sm:text-sm font-mono leading-tight whitespace-pre">
                  {imageCase.asciiArt}
                </pre>
              </div>
            )}

            {/* Image URL */}
            {imageCase.imageUrl && (
              <div className="mb-4 rounded-lg overflow-hidden bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageCase.imageUrl}
                  alt={imageCase.titlePt}
                  className="w-full h-auto max-h-96 object-contain"
                />
              </div>
            )}

            {/* Text description */}
            <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
              {imageCase.imageDescriptionPt}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
