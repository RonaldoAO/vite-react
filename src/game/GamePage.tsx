import { Canvas, useFrame } from '@react-three/fiber'
import { Suspense, memo, useMemo, useRef } from 'react'
import * as THREE from 'three'
import './game.css'

type StarLayerConfig = {
  color: string
  count: number
  opacity: number
  radius: number
  size: number
  twinkle: number
}

const starLayers: StarLayerConfig[] = [
  { color: '#ffffff', count: 1400, opacity: 0.72, radius: 96, size: 0.045, twinkle: 0.025 },
  { color: '#dbe7ff', count: 360, opacity: 0.42, radius: 86, size: 0.065, twinkle: 0.035 },
]

function createStarPositions(count: number, radius: number) {
  const positions = new Float32Array(count * 3)

  for (let index = 0; index < count; index += 1) {
    const angle = Math.random() * Math.PI * 2
    const vertical = Math.acos(THREE.MathUtils.randFloatSpread(2))
    const distance = radius * (0.42 + Math.random() * 0.58)
    const offset = index * 3

    positions[offset] = Math.sin(vertical) * Math.cos(angle) * distance
    positions[offset + 1] = Math.cos(vertical) * distance
    positions[offset + 2] = Math.sin(vertical) * Math.sin(angle) * distance - 30
  }

  return positions
}

const StarLayer = memo(function StarLayer({ config, drift }: { config: StarLayerConfig; drift: number }) {
  const pointsRef = useRef<THREE.Points>(null)
  const positions = useMemo(() => createStarPositions(config.count, config.radius), [config.count, config.radius])

  useFrame((state) => {
    if (!pointsRef.current) {
      return
    }

    pointsRef.current.rotation.y = state.clock.elapsedTime * drift
    const material = pointsRef.current.material

    if (material instanceof THREE.PointsMaterial) {
      material.opacity = config.opacity + Math.sin(state.clock.elapsedTime * 1.8 + drift * 100) * config.twinkle
    }
  })

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color={config.color} size={config.size} transparent opacity={config.opacity} sizeAttenuation depthWrite={false} />
    </points>
  )
})

function SpaceScene() {
  return (
    <>
      <color attach="background" args={['#000108']} />
      <fog attach="fog" args={['#000108', 95, 180]} />
      {starLayers.map((layer, index) => (
        <StarLayer key={layer.color} config={layer} drift={0.004 + index * 0.0025} />
      ))}
    </>
  )
}

export default function GamePage() {
  return (
    <main className="game-page">
      <a href="/" className="space-back" aria-label="Back to portfolio">
        Portfolio
      </a>
      <div className="game-canvas" aria-label="Outer space scene">
        <Canvas
          camera={{ fov: 52, position: [0, 0, 24] }}
          dpr={[1, 1.5]}
          gl={{
            antialias: true,
            powerPreference: 'high-performance',
            stencil: false,
          }}
          performance={{ min: 0.65 }}
          shadows={false}
        >
          <Suspense fallback={null}>
            <SpaceScene />
          </Suspense>
        </Canvas>
      </div>
    </main>
  )
}
