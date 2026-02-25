'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ImageIcon, X } from 'lucide-react'
import type { CIPImageCase } from '@darwin-education/shared'
import { IMAGE_MODALITY_LABELS_PT } from '@darwin-education/shared'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

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
  const [zoomed, setZoomed] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)

  return (
    <div className="space-y-4">
      {/* Clinical Context */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Contexto Clínico</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-label-secondary leading-relaxed">
            {imageCase.clinicalContextPt}
          </p>
        </CardContent>
      </Card>

      {/* Image Display */}
      {showDescription && (
        <Card className="bg-surface-0 border border-separator">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-label-primary flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Exame de Imagem — {modalityLabel}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Real image via Next.js Image */}
            {imageCase.imageUrl && (
              <div className="mb-4">
                <div
                  className="relative rounded-lg overflow-hidden bg-black cursor-zoom-in"
                  onClick={() => setZoomed(true)}
                >
                  {/* Skeleton placeholder */}
                  {!imgLoaded && (
                    <div className="w-full h-64 bg-surface-3 animate-pulse rounded-lg flex items-center justify-center">
                      <span className="text-label-tertiary text-sm">Carregando imagem...</span>
                    </div>
                  )}
                  <Image
                    src={imageCase.imageUrl}
                    alt={imageCase.titlePt}
                    width={800}
                    height={600}
                    className={`w-full h-auto max-h-96 object-contain transition-opacity ${
                      imgLoaded ? 'opacity-100' : 'opacity-0'
                    }`}
                    onLoad={() => setImgLoaded(true)}
                    priority
                  />
                </div>
                {/* Attribution */}
                {imageCase.imageAttribution && (
                  <p className="text-[10px] text-label-tertiary mt-1 italic">
                    {imageCase.imageAttribution}
                  </p>
                )}
              </div>
            )}

            {/* ASCII Art for EKG */}
            {imageCase.asciiArt && (
              <div className="mb-4 overflow-x-auto">
                <pre className="text-green-400 text-xs sm:text-sm font-mono leading-tight whitespace-pre">
                  {imageCase.asciiArt}
                </pre>
              </div>
            )}

            {/* Text description */}
            <div className="text-label-secondary text-sm leading-relaxed whitespace-pre-line">
              {imageCase.imageDescriptionPt}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fullscreen Zoom Modal */}
      {zoomed && imageCase.imageUrl && (
        <div
          className="fixed inset-0 z-overlay bg-black/90 flex items-center justify-center cursor-zoom-out"
          onClick={() => setZoomed(false)}
        >
          <Button
            variant="plain"
            className="absolute top-4 right-4 text-white bg-black/50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-black/70 p-0"
            onClick={() => setZoomed(false)}
          >
            <X className="w-5 h-5" />
          </Button>
          <Image
            src={imageCase.imageUrl}
            alt={imageCase.titlePt}
            width={1400}
            height={1050}
            className="max-w-[95vw] max-h-[95vh] object-contain"
            priority
          />
          {imageCase.imageAttribution && (
            <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-label-tertiary italic bg-black/60 px-3 py-1 rounded">
              {imageCase.imageAttribution}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
