import type { CSSProperties, MouseEvent as ReactMouseEvent, TransitionEvent as ReactTransitionEvent } from 'react'
import { memo, useEffect, useMemo, useRef, useState } from 'react'

type GalleryItem = {
  alt: string
  filename: string
  src: string
}

type HeroMenuItem = {
  href: string
  kind: 'icon' | 'text'
  label: string
}

type AwardItem = {
  image?: string
  name: string
  org: string
}

type AwardHoverDirection = 'from-bottom' | 'from-top'
type AwardPreviewLayer = {
  alt: string
  filename: string
  id: number
  src: string
}
type AwardScrollDirection = 'down' | 'up'
type SpiralCardLayout = {
  item: GalleryItem
  style: CSSProperties
}

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value))
const lerp = (start: number, end: number, amount: number) => start + (end - start) * amount
const entryBandThreshold = 0.18
const shuffleArray = <T,>(items: T[]) => {
  const next = [...items]

  for (let index = next.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    ;[next[index], next[randomIndex]] = [next[randomIndex], next[index]]
  }

  return next
}

const galleryFilenames = [
  'photo1712463980 (2).jpg',
  'photo_4907128963684043898_y.jpg',
  'photo_4907128963684043899_y.jpg',
  'photo_4907128963684043900_y.jpg',
  'photo_4907128963684043901_y.jpg',
  'photo_5089289487463943011_y.jpg',
  'photo_5089289487463943012_y.jpg',
  'photo_5089289487463943013_y.jpg',
  'photo_5089289487463943017_y.jpg',
  'photo_5089289487463943022_y.jpg',
  'photo_5089289487463943023_y.jpg',
  'photo_5127503654037425129_y.jpg',
  'photo_5127503654037425130_y.jpg',
  'photo_5127503654037425131_y.jpg',
  'photo_5132063711006142325_y.jpg',
  'photo_5132063711006142327_y.jpg',
  'photo_5132063711006142338_y.jpg',
  'photo_5132308558501752062_y.jpg',
  'photo_5132308558501752063_y.jpg',
  'photo_5132308558501752064_y.jpg',
  'photo_5132308558501752069_y.jpg',
  'photo_5132308558501752071_y.jpg',
  'photo_5134484543552728560_y.jpg',
  'photo_5134484543552728562_y.jpg',
  'photo_5134484543552728565_y.jpg',
  'photo_5134484543552728566_y.jpg',
]

const galleryItems: GalleryItem[] = galleryFilenames.map((filename) => ({
  alt: filename
    .replace(/\.[^.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim(),
  filename,
  src: `/gallery/${filename}`,
}))

const heroMenuItems: HeroMenuItem[] = [
  {
    href: 'https://drive.google.com/file/d/1p3JoBdXMkwxN4VM2NvpJ2ScbM5klYsdl/view?usp=sharing',
    kind: 'text',
    label: 'Curriculum',
  },
  { href: 'https://www.linkedin.com/in/ronaldoacevedo/', kind: 'icon', label: 'LinkedIn' },
  { href: 'https://github.com/RonaldoAO', kind: 'icon', label: 'GitHub' },
]

const awardItems: AwardItem[] = [
  { name: 'Talent Land 2026', org: 'Finalist', image: '/gallery/awards/TALENT.jpeg' },
  { name: 'Hackathon ITIZ', org: 'Award', image: '/gallery/awards/ITIZ.jpg' },
  { name: 'LOGISTICS HACKATHON', org: 'Finalist', image: '/gallery/awards/LDM.jpeg' },
  { name: 'Economia Circular', org: 'Finalist', image: '/gallery/awards/CMIC.jpeg' },
  { name: 'Interledger hackathon', org: 'First Place', image: '/gallery/awards/INTERLEDGERMEXICO.jpg' },
  { name: 'Nasa Space apps 2025', org: 'Award', image: '/gallery/awards/NASA2025.jpeg' },
  { name: 'Interledger STUDENT OAXACA', org: 'Award', image: '/gallery/awards/INTERLEDGERLOCAL.jpeg' },
  { name: 'La salle code challenge', org: 'Finalist', image: '/gallery/awards/LASALLE2025.jpeg' },
  { name: 'Construyendo el futuro', org: 'Award', image: '/gallery/awards/CENTRO.jpeg' },
  { name: 'Hackathon Canacintra', org: 'Award', image: '/gallery/awards/CANACINTRA.jpeg' },
  { name: 'youth hackathon unesco', org: 'Award', image: '/gallery/awards/UNESCO.jpeg' },
  { name: 'internet computer', org: 'First Place', image: '/gallery/awards/FLOWFINDER.jpeg' },
  { name: 'Mega Hackathon Oaxaca', org: 'First Place', image: '/gallery/awards/VOTEICP.jpeg' },
  { name: 'la salle code challenge 2024', org: 'Finalist', image: '/gallery/awards/LASALLE2024.jpeg' },
  { name: 'talent land 2024', org: 'Finalist', image: '/gallery/awards/TALENT2024.jpeg' },
  { name: 'decima guelaguetza matematica', org: 'Award', image: '/gallery/awards/GUELAGUETZA.jpeg' },
  { name: 'expociencias 2023', org: 'Finalist', image: '/gallery/awards/EXPOCIENCIAS.jpeg' },
  { name: 'la salle code challenge 2022', org: 'Finalist', image: '/gallery/awards/LASALLE2022.jpeg' },
]

const takeoverImage = {
  alt: 'over',
  filename: 'over.jpg',
  src: '/gallery/over.jpg',
}

const initialPreviewLayer: AwardPreviewLayer = {
  alt: 'awards preview',
  filename: 'CANACINTRA.jpeg',
  id: 0,
  src: '/gallery/awards/CANACINTRA.jpeg',
}

const getAwardKey = (award: AwardItem) => `${award.name}-${award.org}`

const getStaticSpiralPoint = (normalized: number) => {
  if (normalized <= entryBandThreshold) {
    const local = normalized / entryBandThreshold

    return {
      angle: lerp(62, -62, local),
      depth: lerp(152, 118, local),
      panelHeight: lerp(192, 186, local),
      radius: lerp(500, 452, local),
      vertical: lerp(-248, -236, local),
    }
  }

  const local = (normalized - entryBandThreshold) / (1 - entryBandThreshold)

  return {
    angle: -56 - local * 780,
    depth: lerp(120, -118, local),
    panelHeight: lerp(184, 126, local),
    radius: lerp(452, 176, local),
    vertical: lerp(-248, 356, local),
  }
}

const SpiralCard = memo(function SpiralCard({ item, style, eager }: SpiralCardLayout & { eager: boolean }) {
  return (
    <div className="spiral-card" style={style}>
      <div className="spiral-face spiral-face-front">
        <img src={item.src} alt={item.alt} loading={eager ? 'eager' : 'lazy'} decoding="async" fetchPriority={eager ? 'high' : 'auto'} />
      </div>
      <div className="spiral-face spiral-face-back">
        <img src={item.src} alt={item.alt} loading={eager ? 'eager' : 'lazy'} decoding="async" />
      </div>
    </div>
  )
})

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6.94 8.5V19H3.53V8.5h3.41ZM7.17 5.25c0 1-.75 1.75-1.93 1.75-1.12 0-1.87-.75-1.87-1.75 0-1.06.75-1.75 1.9-1.75s1.87.69 1.9 1.75ZM20.5 12.57V19h-3.4v-6.03c0-1.52-.54-2.56-1.9-2.56-1.03 0-1.64.69-1.9 1.36-.1.24-.12.58-.12.91V19H9.77s.04-9.74 0-10.5h3.41v1.49c.45-.69 1.26-1.67 3.06-1.67 2.24 0 4.26 1.46 4.26 4.25Z" />
    </svg>
  )
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 .5A11.5 11.5 0 0 0 .5 12.18c0 5.2 3.36 9.6 8.02 11.16.58.1.79-.25.79-.57v-2.03c-3.26.73-3.95-1.42-3.95-1.42-.53-1.4-1.3-1.77-1.3-1.77-1.07-.75.08-.74.08-.74 1.18.08 1.8 1.25 1.8 1.25 1.05 1.86 2.76 1.32 3.43 1.01.11-.78.41-1.31.74-1.61-2.6-.3-5.33-1.34-5.33-5.95 0-1.32.46-2.4 1.2-3.24-.12-.3-.52-1.52.11-3.17 0 0 .98-.32 3.21 1.24a10.9 10.9 0 0 1 5.84 0c2.23-1.56 3.2-1.24 3.2-1.24.64 1.65.24 2.87.12 3.17.75.84 1.2 1.92 1.2 3.24 0 4.62-2.74 5.65-5.35 5.95.42.37.79 1.08.79 2.18v3.23c0 .32.2.68.8.57a11.7 11.7 0 0 0 8-11.16A11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  )
}

function App() {
  const sceneRef = useRef<HTMLElement | null>(null)
  const awardsPanelRef = useRef<HTMLElement | null>(null)
  const frameHandleRef = useRef<number>(0)
  const introFrameHandleRef = useRef<number>(0)
  const awardResetFramesRef = useRef<Record<string, number[]>>({})
  const awardsInputModeMediaRef = useRef<MediaQueryList | null>(null)
  const phoneMediaRef = useRef<MediaQueryList | null>(null)
  const lastKnownScrollYRef = useRef(0)
  const awardPreviewLayerIdRef = useRef(0)
  const awardTrackOffsetsRef = useRef<Record<string, number>>({})
  const awardTrackNoTransitionRef = useRef<Record<string, boolean>>({})
  const awardTrackHoveredRef = useRef<Record<string, boolean>>({})
  const activeTouchAwardKeyRef = useRef<string | null>(null)
  const touchAwardsModeRef = useRef(false)
  const isPhoneRef = useRef(false)

  const [progress, setProgress] = useState(0)
  const [introProgress, setIntroProgress] = useState(0)
  const [awardsPreviewReveal, setAwardsPreviewReveal] = useState(0)
  const [awardsPreviewDesktopVisible, setAwardsPreviewDesktopVisible] = useState(false)
  const [awardTrackOffsets, setAwardTrackOffsets] = useState<Record<string, number>>({})
  const [awardTrackNoTransition, setAwardTrackNoTransition] = useState<Record<string, boolean>>({})
  const [awardPreviewLayers, setAwardPreviewLayers] = useState<AwardPreviewLayer[]>([initialPreviewLayer])
  const [touchAwardsMode, setTouchAwardsMode] = useState(false)
  const [isPhone, setIsPhone] = useState(false)
  const [shuffledGalleryItems] = useState<GalleryItem[]>(() => shuffleArray(galleryItems))

  const spiralCardLayouts = useMemo<SpiralCardLayout[]>(
    () =>
      shuffledGalleryItems.map((item, index, items) => {
        const normalized = items.length > 1 ? index / (items.length - 1) : 0
        const point = getStaticSpiralPoint(normalized)
        const panelHeight = point.panelHeight
        const panelWidth = panelHeight * 0.72

        return {
          item,
          style: {
            height: `${panelHeight}px`,
            width: `${panelWidth}px`,
            transform: `translate3d(-50%, calc(-50% + ${point.vertical}px), ${point.depth}px) rotateY(calc(${point.angle}deg + var(--spin-rotation, 0deg))) translateZ(${point.radius}px)`,
            zIndex: Math.round((1 - normalized) * 100),
          },
        }
      }),
    [shuffledGalleryItems],
  )

  const getAwardByKey = (key: string) => awardItems.find((award) => getAwardKey(award) === key) ?? null

  const setAwardHoveredState = (key: string, hovered: boolean) => {
    awardTrackHoveredRef.current = { ...awardTrackHoveredRef.current, [key]: hovered }
  }

  const setAwardTrackOffset = (key: string, offset: number, disableTransition = false) => {
    awardTrackNoTransitionRef.current = { ...awardTrackNoTransitionRef.current, [key]: disableTransition }
    awardTrackOffsetsRef.current = { ...awardTrackOffsetsRef.current, [key]: offset }
    setAwardTrackNoTransition((previous) => ({ ...previous, [key]: disableTransition }))
    setAwardTrackOffsets((previous) => ({ ...previous, [key]: offset }))
  }

  const clearAwardReset = (key: string) => {
    const handles = awardResetFramesRef.current[key]
    if (!handles) {
      return
    }

    handles.forEach((handle) => window.cancelAnimationFrame(handle))
    delete awardResetFramesRef.current[key]
  }

  const pushAwardPreviewLayer = (award: AwardItem) => {
    const imageSrc = award.image
    if (!imageSrc) {
      return
    }

    awardPreviewLayerIdRef.current += 1
    setAwardPreviewLayers((previous) =>
      [
        ...previous,
        {
          alt: award.name,
          filename: imageSrc.split('/').pop() ?? `awards-preview-${awardPreviewLayerIdRef.current}`,
          id: awardPreviewLayerIdRef.current,
          src: imageSrc,
        },
      ].slice(-8),
    )
  }

  const queueAwardTrackEnter = (key: string, offset: number) => {
    clearAwardReset(key)
    setAwardTrackOffset(key, 0, true)

    const firstHandle = window.requestAnimationFrame(() => {
      if (!awardTrackHoveredRef.current[key]) {
        delete awardResetFramesRef.current[key]
        return
      }

      const secondHandle = window.requestAnimationFrame(() => {
        if (!awardTrackHoveredRef.current[key]) {
          delete awardResetFramesRef.current[key]
          return
        }

        setAwardTrackOffset(key, offset, false)
        delete awardResetFramesRef.current[key]
      })

      awardResetFramesRef.current[key] = [firstHandle, secondHandle]
    })

    awardResetFramesRef.current[key] = [firstHandle]
  }

  const activateAwardByScroll = (key: string, direction: AwardScrollDirection) => {
    const award = getAwardByKey(key)
    if (!award) {
      return
    }

    clearAwardReset(key)
    setAwardHoveredState(key, true)
    setAwardTrackOffset(key, direction === 'down' ? -100 : 100)
    pushAwardPreviewLayer(award)
  }

  const deactivateAwardByScroll = (key: string, direction: AwardScrollDirection) => {
    const currentOffset = awardTrackOffsetsRef.current[key] ?? 0

    if (currentOffset === 0) {
      setAwardHoveredState(key, false)
      return
    }

    clearAwardReset(key)
    setAwardHoveredState(key, false)
    setAwardTrackOffset(key, direction === 'down' ? -200 : 200)
  }

  const updateTouchAwardsActiveRow = (direction: AwardScrollDirection) => {
    if (!touchAwardsModeRef.current || !awardsPanelRef.current) {
      if (activeTouchAwardKeyRef.current) {
        deactivateAwardByScroll(activeTouchAwardKeyRef.current, direction)
        activeTouchAwardKeyRef.current = null
      }
      return
    }

    const rows = Array.from(awardsPanelRef.current.querySelectorAll<HTMLElement>('.awards-row'))
    const visibleRows = rows.filter((row) => {
      const rect = row.getBoundingClientRect()
      return rect.bottom > 0 && rect.top < window.innerHeight
    })

    if (!visibleRows.length) {
      if (activeTouchAwardKeyRef.current) {
        deactivateAwardByScroll(activeTouchAwardKeyRef.current, direction)
        activeTouchAwardKeyRef.current = null
      }
      return
    }

    const anchorY = window.innerHeight * 0.48
    const nextRow = visibleRows.reduce((closest, row) => {
      const rowCenter = row.getBoundingClientRect().top + row.offsetHeight / 2
      const closestCenter = closest.getBoundingClientRect().top + closest.offsetHeight / 2

      return Math.abs(rowCenter - anchorY) < Math.abs(closestCenter - anchorY) ? row : closest
    })

    const nextKey = nextRow.dataset.awardKey ?? null

    if (nextKey === activeTouchAwardKeyRef.current) {
      return
    }

    if (activeTouchAwardKeyRef.current) {
      deactivateAwardByScroll(activeTouchAwardKeyRef.current, direction)
    }

    if (nextKey) {
      activateAwardByScroll(nextKey, direction)
    }

    activeTouchAwardKeyRef.current = nextKey
  }

  useEffect(() => {
    awardsInputModeMediaRef.current = window.matchMedia('(hover: none), (pointer: coarse)')
    phoneMediaRef.current = window.matchMedia('(max-width: 640px)')

    const syncTouchAwardsMode = () => {
      const nextValue = Boolean(awardsInputModeMediaRef.current?.matches)
      touchAwardsModeRef.current = nextValue
      setTouchAwardsMode(nextValue)
    }

    const syncPhoneMode = () => {
      const nextValue = Boolean(phoneMediaRef.current?.matches)
      isPhoneRef.current = nextValue
      setIsPhone(nextValue)
    }

    const updateProgress = () => {
      const scrollDirection: AwardScrollDirection = window.scrollY >= lastKnownScrollYRef.current ? 'down' : 'up'
      lastKnownScrollYRef.current = window.scrollY

      if (!sceneRef.current) {
        setProgress(0)
      } else {
        const { top } = sceneRef.current.getBoundingClientRect()
        const scrollableDistance = sceneRef.current.offsetHeight - window.innerHeight
        const distanceScrolled = clamp(-top, 0, scrollableDistance)
        setProgress(scrollableDistance > 0 ? distanceScrolled / scrollableDistance : 0)
      }

      if (!awardsPanelRef.current) {
        setAwardsPreviewReveal(0)
        setAwardsPreviewDesktopVisible(false)
        return
      }

      const revealRow = awardsPanelRef.current.querySelectorAll<HTMLElement>('.awards-row')[2]

      if (!revealRow) {
        setAwardsPreviewReveal(0)
        setAwardsPreviewDesktopVisible(false)
        return
      }

      const revealRowRect = revealRow.getBoundingClientRect()
      const revealStart = window.innerHeight
      const revealDistance = Math.min(Math.max(revealRowRect.height * 0.45, 72), 150)
      const revealEnd = revealStart - revealDistance

      setAwardsPreviewReveal(clamp((revealStart - revealRowRect.top) / (revealStart - revealEnd)))
      setAwardsPreviewDesktopVisible(revealRowRect.top <= window.innerHeight)
      updateTouchAwardsActiveRow(scrollDirection)
    }

    const requestProgressUpdate = () => {
      window.cancelAnimationFrame(frameHandleRef.current)
      frameHandleRef.current = window.requestAnimationFrame(updateProgress)
    }

    syncTouchAwardsMode()
    syncPhoneMode()
    lastKnownScrollYRef.current = window.scrollY
    updateProgress()
    awardsInputModeMediaRef.current.addEventListener('change', syncTouchAwardsMode)
    phoneMediaRef.current.addEventListener('change', syncPhoneMode)
    window.addEventListener('scroll', requestProgressUpdate, { passive: true })
    window.addEventListener('resize', requestProgressUpdate)

    return () => {
      window.cancelAnimationFrame(frameHandleRef.current)
      awardsInputModeMediaRef.current?.removeEventListener('change', syncTouchAwardsMode)
      phoneMediaRef.current?.removeEventListener('change', syncPhoneMode)
      window.removeEventListener('scroll', requestProgressUpdate)
      window.removeEventListener('resize', requestProgressUpdate)
    }
  }, [])

  useEffect(() => {
    const start = performance.now()

    const tick = (timestamp: number) => {
      const elapsed = timestamp - start
      const duration = 2100
      setIntroProgress(clamp(elapsed / duration))

      if (elapsed < duration) {
        introFrameHandleRef.current = window.requestAnimationFrame(tick)
      }
    }

    introFrameHandleRef.current = window.requestAnimationFrame(tick)

    return () => {
      window.cancelAnimationFrame(introFrameHandleRef.current)
      Object.values(awardResetFramesRef.current).forEach((handles) => {
        handles.forEach((handle) => window.cancelAnimationFrame(handle))
      })
    }
  }, [])

  const handleAwardEnter = (event: ReactMouseEvent<HTMLElement>, award: AwardItem) => {
    if (touchAwardsModeRef.current) {
      return
    }

    const target = event.currentTarget
    const key = getAwardKey(award)
    const bounds = target.getBoundingClientRect()
    const direction: AwardHoverDirection = event.clientY >= bounds.top + bounds.height / 2 ? 'from-bottom' : 'from-top'
    const targetOffset = direction === 'from-bottom' ? -100 : 100
    const currentOffset = awardTrackOffsetsRef.current[key] ?? 0

    clearAwardReset(key)
    setAwardHoveredState(key, true)
    pushAwardPreviewLayer(award)

    if (currentOffset === -200 || currentOffset === 200 || awardTrackNoTransitionRef.current[key]) {
      queueAwardTrackEnter(key, targetOffset)
      return
    }

    setAwardTrackOffset(key, targetOffset)
  }

  const handleAwardLeave = (event: ReactMouseEvent<HTMLElement>, award: AwardItem) => {
    if (touchAwardsModeRef.current) {
      return
    }

    const target = event.currentTarget
    const key = getAwardKey(award)
    const bounds = target.getBoundingClientRect()
    const currentOffset = awardTrackOffsetsRef.current[key] ?? 0
    const leaveDirection: AwardHoverDirection = event.clientY <= bounds.top + bounds.height / 2 ? 'from-top' : 'from-bottom'

    clearAwardReset(key)
    setAwardHoveredState(key, false)

    if (currentOffset === -100) {
      setAwardTrackOffset(key, leaveDirection === 'from-bottom' ? 0 : -200)
      return
    }

    if (currentOffset === 100) {
      setAwardTrackOffset(key, leaveDirection === 'from-top' ? 0 : 200)
      return
    }

    setAwardTrackOffset(key, 0)
  }

  const handleAwardTransitionEnd = (event: ReactTransitionEvent<HTMLDivElement>, award: AwardItem) => {
    if (event.target !== event.currentTarget || event.propertyName !== 'transform') {
      return
    }

    const key = getAwardKey(award)
    const offset = awardTrackOffsetsRef.current[key] ?? 0

    if (awardTrackHoveredRef.current[key] || (offset !== -200 && offset !== 200)) {
      return
    }

    clearAwardReset(key)
    const firstHandle = window.requestAnimationFrame(() => {
      if (awardTrackHoveredRef.current[key]) {
        return
      }

      setAwardTrackOffset(key, 0, true)
      const secondHandle = window.requestAnimationFrame(() => {
        if (awardTrackHoveredRef.current[key]) {
          return
        }

        awardTrackNoTransitionRef.current = { ...awardTrackNoTransitionRef.current, [key]: false }
        setAwardTrackNoTransition((previous) => ({ ...previous, [key]: false }))
        delete awardResetFramesRef.current[key]
      })

      awardResetFramesRef.current[key] = [firstHandle, secondHandle]
    })

    awardResetFramesRef.current[key] = [firstHandle]
  }

  const introEase = 1 - Math.pow(1 - introProgress, 2.6)
  const spinRotation = progress * (isPhone ? 170 : 560) + lerp(-320, 0, introEase)
  const titleOpacity = clamp(1 - progress * 2.8)
  const titleShift = progress * -180
  const titleScale = 1.02 - progress * 0.1
  const titleDepth = -180 - progress * 120
  const textOpacity = clamp(1 - progress * 2.2)
  const spiralPullProgress = clamp(progress / 0.55)
  const spiralPullEase = 1 - Math.pow(1 - spiralPullProgress, 1.45)
  const stageY = lerp(-8, -190, spiralPullEase)
  const stageScale = 0.96 + progress * 0.34
  const stageDepth = 20 + progress * 74
  const glowStrength = 0.2 + progress * 0.55
  const takeoverStart = isPhone ? 0.48 : 0.35
  const takeoverDuration = isPhone ? 0.4 : 0.35
  const takeoverProgress = clamp((progress - takeoverStart) / takeoverDuration)
  const awardsStart = isPhone ? 0.88 : 0.62
  const awardsDuration = isPhone ? 0.14 : 0.22
  const awardsProgress = clamp((progress - awardsStart) / awardsDuration)
  const awardsEase = 1 - Math.pow(1 - awardsProgress, 1.8)

  const heroStyle: CSSProperties = {
    opacity: titleOpacity * introEase,
    transform: `translate3d(-50%, ${titleShift + lerp(-82, 0, introEase)}px, ${titleDepth}px) scale(${lerp(1.06, titleScale, introEase)})`,
  }

  const noteStyle: CSSProperties = {
    opacity: textOpacity * introEase,
    transform: `translate3d(-50%, ${titleShift * 0.45 + lerp(-54, 0, introEase)}px, ${titleDepth - 20}px)`,
  }

  const stageStyle: CSSProperties = {
    '--glow-strength': glowStrength.toFixed(3),
    '--spin-rotation': `${spinRotation}deg`,
    transform: `translate3d(-50%, ${stageY + lerp(-128, 0, introEase)}px, ${stageDepth}px) scale(${lerp(0.9, stageScale, introEase)}) rotateX(-7deg)`,
  } as CSSProperties

  const takeoverStyle: CSSProperties = {
    opacity: 1,
    transform: `translate3d(0, ${lerp(112, 0, takeoverProgress)}%, 0)`,
  }

  const awardsStyle: CSSProperties = {
    opacity: 1,
    transform: `translate3d(0, ${lerp(112, 0, awardsEase)}%, 0)`,
  }

  const awardsPreviewStyle: CSSProperties = touchAwardsMode
    ? {
        opacity: awardsPreviewReveal,
        transform: 'scale(1)',
      }
    : {
        opacity: awardsPreviewDesktopVisible ? 1 : 0,
        transform: awardsPreviewDesktopVisible ? 'scale(1)' : 'scale(0.001)',
      }

  const getAwardTrackClasses = (award: AwardItem) => {
    const key = getAwardKey(award)
    return awardTrackNoTransition[key] ? 'awards-row-track awards-row-track-no-transition' : 'awards-row-track'
  }

  const getAwardTrackStyle = (award: AwardItem): CSSProperties => {
    const key = getAwardKey(award)
    return { ['--award-track-shift' as '--award-track-shift']: `${awardTrackOffsets[key] ?? 0}%` } as CSSProperties
  }

  return (
    <main className="experience-shell">
      <section ref={sceneRef} className="hero-scene">
        <div className="scene-sticky">
          <div className="scene-grid" />

          <div className="scene-meta scene-meta-left">Portfolio</div>
          <nav className="scene-meta scene-meta-right scene-top-links" aria-label="Primary links">
            {heroMenuItems.map((item) => (
              <a
                key={item.label}
                className={item.kind === 'icon' ? 'scene-top-link scene-top-link-icon' : 'scene-top-link'}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                aria-label={item.label}
              >
                {item.label === 'LinkedIn' ? (
                  <LinkedInIcon />
                ) : item.label === 'GitHub' ? (
                  <GitHubIcon />
                ) : (
                  item.label
                )}
              </a>
            ))}
          </nav>

          <div className="scene-depth">
            <header className="hero-copy" style={heroStyle}>
              <p className="hero-tag">Full Stack Developer</p>
              <h1>Ronaldo Acevedo OJEDA</h1>
            </header>

            <p className="scene-note" style={noteStyle}>

            </p>

            <div className="spiral-stage" style={stageStyle} id="gallery">
              <div className="spiral-aura" />
              <div className="spiral-column">
                {spiralCardLayouts.map(({ item, style }, index) => (
                  <SpiralCard key={item.filename} item={item} style={style} eager={index < 6} />
                ))}
              </div>
            </div>

            <div className="scroll-hint">Follow The Spiral</div>
          </div>

          <section className="takeover-panel" style={takeoverStyle}>
            <div className="takeover-grid" />

            <div className="takeover-meta takeover-meta-left">Ronaldo Acevedo Ojeda</div>
            <div className="takeover-meta takeover-meta-right"></div>

            <div className="takeover-copy">
              <div>
                <p className="takeover-kicker">Always Evolving</p>
                <h2>Software Engineer</h2>
              </div>

              <div>
                <p className="takeover-description">
                  I&apos;m a software engineer working with Python, Go, and JavaScript on AWS, focused on backend systems,
                  data processing, and turning complex logic into usable products.
                </p>
                <a className="takeover-link" href="#gallery">
                  ALL PROJECTS
                </a>
              </div>
            </div>

            <div className="takeover-visual">
              <div className="takeover-frame">
                <img src={takeoverImage.src} alt={takeoverImage.alt} loading="lazy" />
              </div>
            </div>

            <div className="takeover-mobile-scrollcue" aria-hidden="true">
              <span className="takeover-mobile-scrollcue-arrow">
                <span />
                <span />
              </span>
              <p>Keep scrolling</p>
            </div>
          </section>
        </div>
      </section>

      <section ref={awardsPanelRef} className="awards-panel" style={awardsStyle}>
        <div className="awards-header">
          <p>Recognitions &amp; Awards ({awardItems.length})</p>
        </div>

        <div className="awards-stage">
          <div className="awards-list">
            {awardItems.map((award) => (
              <article
                key={getAwardKey(award)}
                className="awards-row"
                data-award-key={getAwardKey(award)}
                onMouseEnter={(event) => handleAwardEnter(event, award)}
                onMouseLeave={(event) => handleAwardLeave(event, award)}
              >
                <div
                  className={getAwardTrackClasses(award)}
                  style={getAwardTrackStyle(award)}
                  onTransitionEnd={(event) => handleAwardTransitionEnd(event, award)}
                >
                  <div className="awards-row-surface awards-row-surface-default awards-row-surface-clear-top" aria-hidden="true">
                    <h3>{award.name}</h3>
                    <p>{award.org}</p>
                  </div>

                  <div className="awards-row-surface awards-row-surface-hover awards-row-surface-hover-top" aria-hidden="true">
                    <h3>{award.name}</h3>
                    <p>{award.org}</p>
                  </div>

                  <div className="awards-row-surface awards-row-surface-default awards-row-surface-default-main">
                    <h3>{award.name}</h3>
                    <p>{award.org}</p>
                  </div>

                  <div
                    className="awards-row-surface awards-row-surface-hover awards-row-surface-hover-bottom"
                    aria-hidden="true"
                  >
                    <h3>{award.name}</h3>
                    <p>{award.org}</p>
                  </div>

                  <div
                    className="awards-row-surface awards-row-surface-default awards-row-surface-clear-bottom"
                    aria-hidden="true"
                  >
                    <h3>{award.name}</h3>
                    <p>{award.org}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="awards-preview" style={awardsPreviewStyle}>
            <div className="awards-preview-frame">
              {awardPreviewLayers.map((layer, index) => (
                <img
                  key={layer.id}
                  className="awards-preview-image"
                  style={{ zIndex: index + 1 }}
                  src={layer.src}
                  alt={layer.alt}
                  loading="lazy"
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default App
