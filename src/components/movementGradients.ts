import { Era } from '../types/core'

/** Mood gradient for a movement card header image — keyed by era + draw level. */
export function gradientForWork(era: Era, audienceDraw: number): string {
  const intensity: 'bold' | 'medium' | 'subtle' =
    audienceDraw >= 75 ? 'bold' : audienceDraw >= 45 ? 'medium' : 'subtle'

  const palettes: Record<Era, Record<typeof intensity, string>> = {
    classical: {
      bold: 'linear-gradient(165deg, #5a4a7a 0%, #382848 40%, #1f1830 100%)',
      medium: 'linear-gradient(165deg, #6e5e8a 0%, #443458 50%, #2a1f3a 100%)',
      subtle: 'linear-gradient(165deg, #8a7da0 0%, #5a4d6e 60%, #3a2f4a 100%)',
    },
    romantic: {
      bold: 'linear-gradient(165deg, #8b3a3a 0%, #5a1f1f 45%, #2a0e0e 100%)',
      medium: 'linear-gradient(165deg, #a05a52 0%, #6e3535 50%, #3a1c1c 100%)',
      subtle: 'linear-gradient(165deg, #b78870 0%, #7a5040 60%, #4a2e22 100%)',
    },
    'late-romantic': {
      bold: 'linear-gradient(165deg, #6b4a2a 0%, #4a2e18 45%, #28180a 100%)',
      medium: 'linear-gradient(165deg, #8a6a4a 0%, #5a3e28 50%, #322014 100%)',
      subtle: 'linear-gradient(165deg, #a08868 0%, #6e5238 60%, #3a2818 100%)',
    },
    contemporary: {
      bold: 'linear-gradient(165deg, #4a6b5a 0%, #2a4838 45%, #142820 100%)',
      medium: 'linear-gradient(165deg, #6a8a78 0%, #3e5e4c 50%, #1f3a2c 100%)',
      subtle: 'linear-gradient(165deg, #88a094 0%, #5a7068 60%, #2e4238 100%)',
    },
  }

  return palettes[era][intensity]
}

/** Short flavor descriptor for a work, used on movement cards. */
export function flavorForWork(era: Era, audienceDraw: number): string {
  if (era === 'classical') {
    if (audienceDraw >= 75) return 'Architectural clarity meets dramatic force.'
    return 'Structural rigor and quiet revelation.'
  }
  if (era === 'romantic') {
    if (audienceDraw >= 75) return 'Sweeping passion and orchestral grandeur.'
    return 'Intimate longing rendered in full color.'
  }
  if (era === 'late-romantic') {
    if (audienceDraw >= 75) return 'Cinematic scale and emotional weight.'
    return 'Dense harmonies and elegiac restraint.'
  }
  if (audienceDraw >= 60) return 'A modern voice in vivid dialogue with tradition.'
  return 'Quiet, searching, and unmistakably present.'
}
