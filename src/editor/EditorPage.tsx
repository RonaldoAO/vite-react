import { Canvas, type ThreeEvent, useFrame, useThree } from '@react-three/fiber'
import { Suspense, memo, useCallback, useEffect, useMemo, useState } from 'react'
import { FaArrowsAlt, FaClone, FaCube, FaDatabase, FaDotCircle, FaDrawPolygon, FaGem, FaLayerGroup, FaPlay, FaRegCircle, FaTrash } from 'react-icons/fa'
import * as THREE from 'three'
import './editor.css'

type ShapeKind = 'box' | 'sphere' | 'cylinder' | 'cone' | 'torus' | 'dodecahedron' | 'singleMesh'

type MeshPartKind = 'ellipsoid' | 'cone' | 'cylinder' | 'box'
type ModelCategory = 'bear' | 'house' | 'spaceship' | 'airplane' | 'tree' | 'tower' | 'abstract'

type MeshPart = {
  kind: MeshPartKind
  position: [number, number, number]
  rotation: [number, number, number]
  scale: [number, number, number]
}

type MeshProfile = {
  category: ModelCategory
  color: string
  height: number
  horned: boolean
  parts: MeshPart[]
  style: string
}

type SceneShape = {
  color: string
  id: string
  kind: ShapeKind
  meshProfile?: MeshProfile
  position: [number, number, number]
  rotationY: number
  scale: number
}

type GeneratedPrimitive = {
  color: string
  kind: ShapeKind
  meshProfile?: MeshProfile
  position: [number, number, number]
  rotationY: number
  scale: number
}

type GeneratedScene = {
  shapes: GeneratedPrimitive[]
}

type ModelBlueprint = {
  category: ModelCategory
  color: string
  constructionRules: string[]
  height: number
  horned: boolean
  optionalParts: string[]
  requiredParts: string[]
  subject: string
}

type ModelReview = {
  approved: boolean
  missingParts: string[]
  reason: string
  score: number
  suggestedCategory: ModelCategory
  suggestedHorned: boolean
}

type ShapeDefinition = {
  Icon: typeof FaCube
  kind: ShapeKind
  label: string
}

const shapeDefinitions: ShapeDefinition[] = [
  { Icon: FaCube, kind: 'box', label: 'Cubo' },
  { Icon: FaRegCircle, kind: 'sphere', label: 'Esfera' },
  { Icon: FaDatabase, kind: 'cylinder', label: 'Cilindro' },
  { Icon: FaPlay, kind: 'cone', label: 'Cono' },
  { Icon: FaDotCircle, kind: 'torus', label: 'Toro' },
  { Icon: FaGem, kind: 'dodecahedron', label: 'Poliedro' },
]

const colorSwatches = ['#f56f42', '#ffce5c', '#5bd37f', '#4db6ff', '#8f7cff', '#f071b8', '#f2f0e7', '#1d2633']

const initialShapes: SceneShape[] = [
  { color: '#4db6ff', id: 'shape-1', kind: 'box', position: [-2.4, 0, 0], rotationY: 0.2, scale: 1 },
  { color: '#ffce5c', id: 'shape-2', kind: 'sphere', position: [0, 0, 0.6], rotationY: 0, scale: 1 },
  { color: '#f56f42', id: 'shape-3', kind: 'cone', position: [2.4, 0, -0.4], rotationY: -0.3, scale: 1 },
]

const geometrySchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    shapes: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          kind: {
            type: 'string',
            enum: ['singleMesh'],
          },
          color: {
            type: 'string',
          },
          position: {
            type: 'array',
            items: {
              type: 'number',
            },
          },
          rotationY: {
            type: 'number',
          },
          scale: {
            type: 'number',
          },
          meshProfile: {
            type: 'object',
            additionalProperties: false,
            properties: {
              color: {
                type: 'string',
              },
              category: {
                type: 'string',
                enum: ['bear', 'house', 'spaceship', 'airplane', 'tree', 'tower', 'abstract'],
              },
              height: {
                type: 'number',
              },
              horned: {
                type: 'boolean',
              },
              style: {
                type: 'string',
              },
              parts: {
                type: 'array',
                items: {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    kind: {
                      type: 'string',
                      enum: ['ellipsoid', 'cone', 'cylinder', 'box'],
                    },
                    position: {
                      type: 'array',
                      items: {
                        type: 'number',
                      },
                    },
                    scale: {
                      type: 'array',
                      items: {
                        type: 'number',
                      },
                    },
                    rotation: {
                      type: 'array',
                      items: {
                        type: 'number',
                      },
                    },
                  },
                  required: ['kind', 'position', 'scale', 'rotation'],
                },
              },
            },
            required: ['category', 'color', 'height', 'horned', 'style', 'parts'],
          },
        },
        required: ['kind', 'color', 'position', 'rotationY', 'scale', 'meshProfile'],
      },
    },
  },
  required: ['shapes'],
}

const blueprintSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    subject: { type: 'string' },
    category: {
      type: 'string',
      enum: ['bear', 'house', 'spaceship', 'airplane', 'tree', 'tower', 'abstract'],
    },
    color: { type: 'string' },
    height: { type: 'number' },
    horned: { type: 'boolean' },
    requiredParts: {
      type: 'array',
      items: { type: 'string' },
    },
    optionalParts: {
      type: 'array',
      items: { type: 'string' },
    },
    constructionRules: {
      type: 'array',
      items: { type: 'string' },
    },
  },
  required: ['subject', 'category', 'color', 'height', 'horned', 'requiredParts', 'optionalParts', 'constructionRules'],
}

const reviewSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    approved: { type: 'boolean' },
    score: { type: 'number' },
    reason: { type: 'string' },
    missingParts: {
      type: 'array',
      items: { type: 'string' },
    },
    suggestedCategory: {
      type: 'string',
      enum: ['bear', 'house', 'spaceship', 'airplane', 'tree', 'tower', 'abstract'],
    },
    suggestedHorned: { type: 'boolean' },
  },
  required: ['approved', 'score', 'reason', 'missingParts', 'suggestedCategory', 'suggestedHorned'],
}

const createShape = (kind: ShapeKind, index: number): SceneShape => ({
  color: colorSwatches[index % colorSwatches.length],
  id: `shape-${Date.now()}-${index}`,
  kind,
  position: [((index % 5) - 2) * 1.8, 0, Math.floor(index / 5) * 1.8],
  rotationY: 0,
  scale: 1,
})

const part = (
  kind: MeshPartKind,
  position: [number, number, number],
  scale: [number, number, number],
  rotation: [number, number, number] = [0, 0, 0],
): MeshPart => ({ kind, position, rotation, scale })

const categoryConstructors: Record<ModelCategory, (profile: MeshProfile) => MeshPart[]> = {
  abstract: (profile) =>
    profile.parts.length
      ? profile.parts
      : [
          part('ellipsoid', [0, 0.6, 0], [1, 1.3, 0.8]),
          part('cone', [0, 1.8, 0], [0.75, 1.1, 0.75]),
          part('box', [0, 0.8, 0], [1.45, 0.16, 1.45], [0, Math.PI / 4, 0]),
        ],
  bear: (profile) => [
    part('ellipsoid', [0, 0.9, 0], [1.05, 1.2, 0.72]),
    part('ellipsoid', [0, 2.05, 0.08], [0.72, 0.68, 0.62]),
    part('ellipsoid', [0, 1.92, 0.62], [0.38, 0.24, 0.28]),
    part('ellipsoid', [-0.48, 2.55, 0.02], [0.22, 0.24, 0.18]),
    part('ellipsoid', [0.48, 2.55, 0.02], [0.22, 0.24, 0.18]),
    part('cylinder', [-0.52, 0.0, 0.34], [0.22, 0.78, 0.22], [0.18, 0, 0.08]),
    part('cylinder', [0.52, 0.0, 0.34], [0.22, 0.78, 0.22], [0.18, 0, -0.08]),
    part('cylinder', [-0.82, 0.78, 0.04], [0.18, 0.7, 0.18], [0, 0, -0.42]),
    part('cylinder', [0.82, 0.78, 0.04], [0.18, 0.7, 0.18], [0, 0, 0.42]),
    ...(profile.horned
      ? [
          part('cone', [-0.36, 2.92, 0.04], [0.16, 0.62, 0.16], [0, 0, -0.32]),
          part('cone', [0.36, 2.92, 0.04], [0.16, 0.62, 0.16], [0, 0, 0.32]),
        ]
      : []),
  ],
  house: () => [
    part('box', [0, 0.55, 0], [1.35, 1.1, 1.05]),
    part('cone', [0, 1.45, 0], [1.65, 0.9, 1.25], [0, Math.PI / 4, 0]),
    part('box', [0, 0.18, 0.56], [0.32, 0.36, 0.08]),
    part('box', [-0.56, 0.72, 0.58], [0.26, 0.26, 0.08]),
    part('box', [0.56, 0.72, 0.58], [0.26, 0.26, 0.08]),
  ],
  spaceship: () => [
    part('ellipsoid', [0, 0.65, 0], [0.58, 0.42, 1.85]),
    part('cone', [0, 0.65, -1.52], [0.58, 0.92, 0.58], [Math.PI / 2, 0, 0]),
    part('box', [-0.85, 0.45, 0.24], [0.92, 0.12, 0.56], [0, 0.25, -0.12]),
    part('box', [0.85, 0.45, 0.24], [0.92, 0.12, 0.56], [0, -0.25, 0.12]),
    part('ellipsoid', [0, 0.98, -0.32], [0.34, 0.2, 0.5]),
    part('cylinder', [-0.34, 0.48, 1.55], [0.18, 0.42, 0.18], [Math.PI / 2, 0, 0]),
    part('cylinder', [0.34, 0.48, 1.55], [0.18, 0.42, 0.18], [Math.PI / 2, 0, 0]),
  ],
  airplane: () => [
    part('ellipsoid', [0, 0.72, 0], [0.42, 0.36, 2.18]),
    part('cone', [0, 0.72, -1.92], [0.42, 0.72, 0.42], [Math.PI / 2, 0, 0]),
    part('ellipsoid', [0, 1.05, -0.72], [0.28, 0.16, 0.48]),
    part('box', [-1.18, 0.68, -0.1], [1.85, 0.1, 0.42], [0, 0.08, -0.04]),
    part('box', [1.18, 0.68, -0.1], [1.85, 0.1, 0.42], [0, -0.08, 0.04]),
    part('box', [0, 1.1, 1.48], [0.18, 0.78, 0.5]),
    part('box', [-0.52, 0.98, 1.58], [0.76, 0.08, 0.34], [0, 0.2, 0.2]),
    part('box', [0.52, 0.98, 1.58], [0.76, 0.08, 0.34], [0, -0.2, -0.2]),
    part('cylinder', [-0.42, 0.24, -0.4], [0.14, 0.12, 0.14], [Math.PI / 2, 0, 0]),
    part('cylinder', [0.42, 0.24, -0.4], [0.14, 0.12, 0.14], [Math.PI / 2, 0, 0]),
    part('cylinder', [0, 0.24, 1.05], [0.14, 0.12, 0.14], [Math.PI / 2, 0, 0]),
  ],
  tower: () => [
    part('cylinder', [0, 0.9, 0], [0.55, 1.8, 0.55]),
    part('cylinder', [0, 2.15, 0], [0.72, 0.32, 0.72]),
    part('cone', [0, 2.72, 0], [0.62, 0.92, 0.62]),
    part('box', [0, 0.18, 0.56], [0.26, 0.36, 0.08]),
  ],
  tree: () => [
    part('cylinder', [0, 0.65, 0], [0.22, 1.3, 0.22]),
    part('cone', [0, 1.55, 0], [0.95, 1.25, 0.95]),
    part('cone', [0, 2.15, 0], [0.78, 1.05, 0.78]),
    part('cone', [0, 2.68, 0], [0.56, 0.82, 0.56]),
  ],
}

function createProceduralGeometry(profile: MeshProfile) {
  const positions: number[] = []
  const indices: number[] = []
  const parts = categoryConstructors[profile.category]?.(profile) ?? categoryConstructors.abstract(profile)

  for (const part of parts) {
    const source =
      part.kind === 'cone'
        ? new THREE.ConeGeometry(0.5, 1, 18)
        : part.kind === 'cylinder'
          ? new THREE.CylinderGeometry(0.5, 0.5, 1, 18)
          : part.kind === 'box'
            ? new THREE.BoxGeometry(1, 1, 1, 2, 2, 2)
            : new THREE.SphereGeometry(0.5, 18, 12)

    const matrix = new THREE.Matrix4()
    const rotation = new THREE.Euler(part.rotation[0], part.rotation[1], part.rotation[2])
    const quaternion = new THREE.Quaternion().setFromEuler(rotation)
    matrix.compose(
      new THREE.Vector3(part.position[0], part.position[1], part.position[2]),
      quaternion,
      new THREE.Vector3(part.scale[0], part.scale[1], part.scale[2]),
    )
    source.applyMatrix4(matrix)

    const attribute = source.getAttribute('position')
    const indexOffset = positions.length / 3

    for (let index = 0; index < attribute.count; index += 1) {
      positions.push(attribute.getX(index), attribute.getY(index), attribute.getZ(index))
    }

    const sourceIndex = source.getIndex()

    if (sourceIndex) {
      for (let index = 0; index < sourceIndex.count; index += 1) {
        indices.push(sourceIndex.getX(index) + indexOffset)
      }
    } else {
      for (let index = 0; index < attribute.count; index += 1) {
        indices.push(index + indexOffset)
      }
    }

    source.dispose()
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  geometry.center()
  geometry.computeBoundingBox()

  const bounds = geometry.boundingBox
  const currentHeight = bounds ? bounds.max.y - bounds.min.y : 0
  const targetHeight = THREE.MathUtils.clamp(profile.height || 2.2, 0.8, 5)

  if (currentHeight > 0) {
    const scale = targetHeight / currentHeight
    geometry.scale(scale, scale, scale)
    geometry.center()
  }

  return geometry
}

const readResponseText = (data: unknown) => {
  if (typeof data !== 'object' || data === null) {
    return ''
  }

  const response = data as { output?: Array<{ content?: Array<{ text?: string; type?: string }> }>; output_text?: string }

  if (typeof response.output_text === 'string') {
    return response.output_text
  }

  return (
    response.output
      ?.flatMap((item) => item.content ?? [])
      .map((content) => content.text ?? '')
      .join('') ?? ''
  )
}

const normalizeGeneratedShapes = (generatedScene: GeneratedScene, existingCount: number): SceneShape[] =>
  generatedScene.shapes.slice(0, 16).map((shape, index) => {
    const position = Array.isArray(shape.position) ? shape.position : [0, 0, 0]

    return {
      color: /^#[0-9a-f]{6}$/i.test(shape.color) ? shape.color : colorSwatches[(existingCount + index) % colorSwatches.length],
      id: `ai-shape-${Date.now()}-${index}`,
      kind: 'singleMesh',
      meshProfile: {
        category:
          shape.meshProfile?.category === 'house' ||
          shape.meshProfile?.category === 'spaceship' ||
          shape.meshProfile?.category === 'airplane' ||
          shape.meshProfile?.category === 'tree' ||
          shape.meshProfile?.category === 'tower' ||
          shape.meshProfile?.category === 'abstract'
            ? shape.meshProfile.category
            : 'bear',
        color: /^#[0-9a-f]{6}$/i.test(shape.meshProfile?.color ?? '') ? shape.meshProfile!.color : shape.color,
        height: THREE.MathUtils.clamp(Number(shape.meshProfile?.height) || 2.2, 0.8, 5),
        horned: Boolean(shape.meshProfile?.horned),
        parts: (shape.meshProfile?.parts ?? []).slice(0, 32).map((part) => ({
          kind: part.kind === 'cone' || part.kind === 'cylinder' || part.kind === 'box' ? part.kind : 'ellipsoid',
          position: [
            THREE.MathUtils.clamp(Number(part.position?.[0]) || 0, -2.8, 2.8),
            THREE.MathUtils.clamp(Number(part.position?.[1]) || 0, -1.8, 4.8),
            THREE.MathUtils.clamp(Number(part.position?.[2]) || 0, -2.8, 2.8),
          ],
          rotation: [
            THREE.MathUtils.clamp(Number(part.rotation?.[0]) || 0, -Math.PI, Math.PI),
            THREE.MathUtils.clamp(Number(part.rotation?.[1]) || 0, -Math.PI, Math.PI),
            THREE.MathUtils.clamp(Number(part.rotation?.[2]) || 0, -Math.PI, Math.PI),
          ],
          scale: [
            THREE.MathUtils.clamp(Number(part.scale?.[0]) || 1, 0.08, 2.8),
            THREE.MathUtils.clamp(Number(part.scale?.[1]) || 1, 0.08, 2.8),
            THREE.MathUtils.clamp(Number(part.scale?.[2]) || 1, 0.08, 2.8),
          ],
        })),
        style: String(shape.meshProfile?.style ?? '').slice(0, 48),
      },
      position: [
        THREE.MathUtils.clamp(Number(position[0]) || 0, -7.8, 7.8),
        THREE.MathUtils.clamp(Number(position[1]) || 0, 0, 5),
        THREE.MathUtils.clamp(Number(position[2]) || 0, -5.4, 5.4),
      ],
      rotationY: Number(shape.rotationY) || 0,
      scale: THREE.MathUtils.clamp(Number(shape.scale) || 1, 0.25, 3),
    }
  })

const wait = (milliseconds: number) =>
  new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds)
  })

const requestOpenAIJson = async <T,>({
  apiKey,
  input,
  maxOutputTokens = 1200,
  schema,
  schemaName,
  setStatus,
}: {
  apiKey: string
  input: Array<{ content: string; role: 'system' | 'user' }>
  maxOutputTokens?: number
  schema: object
  schemaName: string
  setStatus: (status: string) => void
}) => {
  const requestBody = {
    model: 'gpt-4o-mini',
    input,
    max_output_tokens: maxOutputTokens,
    text: {
      format: {
        type: 'json_schema',
        name: schemaName,
        strict: true,
        schema,
      },
    },
  }

  let data: unknown = null
  let lastError = ''

  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (attempt > 0) {
      setStatus(`Reintentando ${attempt + 1}/3`)
      await wait(700 * attempt)
    }

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    const responseText = await response.text()

    if (response.ok) {
      data = JSON.parse(responseText)
      break
    }

    lastError = responseText || `OpenAI API error ${response.status}`

    if (response.status < 500 || attempt === 2) {
      throw new Error(lastError)
    }
  }

  if (!data) {
    throw new Error(lastError || 'No se pudo generar')
  }

  return JSON.parse(readResponseText(data)) as T
}

function ShapeGeometry({ kind }: { kind: ShapeKind }) {
  if (kind === 'sphere') {
    return <sphereGeometry args={[0.9, 32, 18]} />
  }

  if (kind === 'cylinder') {
    return <cylinderGeometry args={[0.72, 0.72, 1.8, 32]} />
  }

  if (kind === 'cone') {
    return <coneGeometry args={[0.86, 1.9, 32]} />
  }

  if (kind === 'torus') {
    return <torusGeometry args={[0.72, 0.22, 18, 42]} />
  }

  if (kind === 'dodecahedron') {
    return <dodecahedronGeometry args={[0.95, 0]} />
  }

  return <boxGeometry args={[1.55, 1.55, 1.55]} />
}

function ProceduralMeshGeometry({ profile }: { profile: MeshProfile }) {
  const geometry = useMemo(() => createProceduralGeometry(profile), [profile])

  return <primitive object={geometry} attach="geometry" />
}

const SceneObject = memo(function SceneObject({
  isSelected,
  onDragStart,
  onSelect,
  shape,
}: {
  isSelected: boolean
  onDragStart: (id: string) => void
  onSelect: (id: string) => void
  shape: SceneShape
}) {
  const objectHeight = shape.kind === 'singleMesh' ? (shape.meshProfile?.height ?? 2.2) * 0.85 : shape.kind === 'torus' || shape.kind === 'dodecahedron' ? 1.45 : 1.75

  return (
    <group position={[shape.position[0], shape.position[1] + (objectHeight * shape.scale) / 2, shape.position[2]]} rotation={[0, shape.rotationY, 0]} scale={shape.scale}>
      <mesh
        onPointerDown={(event: ThreeEvent<PointerEvent>) => {
          event.stopPropagation()
          onSelect(shape.id)
          onDragStart(shape.id)
        }}
      >
        {shape.kind === 'singleMesh' && shape.meshProfile ? <ProceduralMeshGeometry profile={shape.meshProfile} /> : <ShapeGeometry kind={shape.kind} />}
        <meshStandardMaterial color={shape.meshProfile?.color ?? shape.color} roughness={0.52} metalness={shape.kind === 'singleMesh' ? 0.14 : 0.08} />
      </mesh>
      {isSelected ? (
        <mesh scale={1.08}>
          {shape.kind === 'singleMesh' && shape.meshProfile ? <ProceduralMeshGeometry profile={shape.meshProfile} /> : <ShapeGeometry kind={shape.kind} />}
          <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.55} />
        </mesh>
      ) : null}
    </group>
  )
})

function DragController({
  draggingId,
  onDragEnd,
  updateShape,
}: {
  draggingId: string | null
  onDragEnd: () => void
  updateShape: (id: string, patch: Partial<SceneShape>) => void
}) {
  const { camera, gl, raycaster } = useThree()
  const groundPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), [])
  const pointer = useMemo(() => new THREE.Vector2(), [])
  const intersection = useMemo(() => new THREE.Vector3(), [])

  useEffect(() => {
    if (!draggingId) {
      return
    }

    const updateFromPointer = (event: PointerEvent) => {
      const bounds = gl.domElement.getBoundingClientRect()
      pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1
      pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1
      raycaster.setFromCamera(pointer, camera)

      if (raycaster.ray.intersectPlane(groundPlane, intersection)) {
        updateShape(draggingId, {
          position: [THREE.MathUtils.clamp(intersection.x, -7.8, 7.8), 0, THREE.MathUtils.clamp(intersection.z, -5.4, 5.4)],
        })
      }
    }

    window.addEventListener('pointermove', updateFromPointer)
    window.addEventListener('pointerup', onDragEnd)

    return () => {
      window.removeEventListener('pointermove', updateFromPointer)
      window.removeEventListener('pointerup', onDragEnd)
    }
  }, [camera, draggingId, gl, groundPlane, intersection, onDragEnd, pointer, raycaster, updateShape])

  return null
}

function CameraRig() {
  const { camera } = useThree()
  const targetPosition = useMemo(() => new THREE.Vector3(7.5, 7.2, 9.5), [])

  useFrame(() => {
    camera.position.lerp(targetPosition, 0.06)
    camera.lookAt(0, 0.45, 0)
  })

  return null
}

function EditorScene({
  draggingId,
  onCanvasSelect,
  onDragEnd,
  onDragStart,
  selectedId,
  shapes,
  updateShape,
}: {
  draggingId: string | null
  onCanvasSelect: () => void
  onDragEnd: () => void
  onDragStart: (id: string) => void
  selectedId: string | null
  shapes: SceneShape[]
  updateShape: (id: string, patch: Partial<SceneShape>) => void
}) {
  return (
    <>
      <color attach="background" args={['#0b0d10']} />
      <ambientLight intensity={0.62} />
      <directionalLight position={[6, 9, 5]} intensity={2.4} />
      <pointLight position={[-5, 4, -4]} color="#68d7ff" intensity={1.5} distance={16} />
      <gridHelper args={[18, 18, '#4e5968', '#202833']} position={[0, -0.01, 0]} />
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.03, 0]}
        onPointerDown={() => {
          onCanvasSelect()
        }}
      >
        <planeGeometry args={[18, 12]} />
        <meshStandardMaterial color="#111821" roughness={0.88} />
      </mesh>
      {shapes.map((shape) => (
        <SceneObject key={shape.id} shape={shape} isSelected={shape.id === selectedId} onSelect={updateShapeSelection} onDragStart={onDragStart} />
      ))}
      <DragController draggingId={draggingId} onDragEnd={onDragEnd} updateShape={updateShape} />
      <CameraRig />
    </>
  )

  function updateShapeSelection(id: string) {
    updateShape(id, {})
  }
}

function NumberField({
  label,
  onChange,
  step = 0.1,
  value,
}: {
  label: string
  onChange: (value: number) => void
  step?: number
  value: number
}) {
  return (
    <label className="editor-field">
      <span>{label}</span>
      <input type="number" step={step} value={Number(value.toFixed(2))} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  )
}

export default function EditorPage() {
  const [shapes, setShapes] = useState<SceneShape[]>(initialShapes)
  const [selectedId, setSelectedId] = useState<string | null>(initialShapes[0]?.id ?? null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [apiKey, setApiKey] = useState(() => sessionStorage.getItem('openai_api_key') ?? '')
  const [generationPrompt, setGenerationPrompt] = useState('')
  const [generationStatus, setGenerationStatus] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const selectedShape = shapes.find((shape) => shape.id === selectedId) ?? null

  const updateShape = useCallback((id: string, patch: Partial<SceneShape>) => {
    setSelectedId(id)
    setShapes((currentShapes) => currentShapes.map((shape) => (shape.id === id ? { ...shape, ...patch } : shape)))
  }, [])

  const addShape = (kind: ShapeKind) => {
    const nextShape = createShape(kind, shapes.length + 1)
    setShapes((currentShapes) => [...currentShapes, nextShape])
    setSelectedId(nextShape.id)
  }

  const deleteSelected = () => {
    if (!selectedId) {
      return
    }

    setShapes((currentShapes) => currentShapes.filter((shape) => shape.id !== selectedId))
    setSelectedId(null)
  }

  const duplicateSelected = () => {
    if (!selectedShape) {
      return
    }

    const nextShape: SceneShape = {
      ...selectedShape,
      id: `shape-${Date.now()}`,
      position: [selectedShape.position[0] + 1.1, selectedShape.position[1], selectedShape.position[2] + 1.1],
    }

    setShapes((currentShapes) => [...currentShapes, nextShape])
    setSelectedId(nextShape.id)
  }

  const updateSelected = (patch: Partial<SceneShape>) => {
    if (!selectedShape) {
      return
    }

    updateShape(selectedShape.id, patch)
  }

  const generateGeometry = async () => {
    const trimmedKey = apiKey.trim()
    const trimmedPrompt = generationPrompt.trim()

    if (!trimmedKey || !trimmedPrompt || isGenerating) {
      setGenerationStatus('Falta key o prompt')
      return
    }

    setIsGenerating(true)
    setGenerationStatus('Generando')
    sessionStorage.setItem('openai_api_key', trimmedKey)

    try {
      setGenerationStatus('Analizando partes')

      const blueprint = await requestOpenAIJson<ModelBlueprint>({
        apiKey: trimmedKey,
        schema: blueprintSchema,
        schemaName: 'model_blueprint',
        setStatus: setGenerationStatus,
        input: [
          {
            role: 'system',
            content:
              'You are a 3D model planner for a primitive-geometry editor. Decompose the user request into a construction blueprint. Choose exactly one category: bear, house, spaceship, airplane, tree, tower, or abstract. For airplanes, required parts must include fuselage, cockpit, two main wings, tail, and landing wheels. For animals, include body, head, limbs, ears or identifying features. For houses, include base, roof, door, and windows. Return compact JSON only.',
          },
          {
            role: 'user',
            content: `Plan the required visible parts for: ${trimmedPrompt}`,
          },
        ],
      })

      setGenerationStatus('Construyendo modelo')

      const generatedScene = await requestOpenAIJson<GeneratedScene>({
        apiKey: trimmedKey,
        schema: geometrySchema,
        schemaName: 'geometry_model',
        setStatus: setGenerationStatus,
        input: [
          {
            role: 'system',
            content:
              'You convert a validated blueprint into one compact 3D model for this editor. Return JSON only with exactly one top-level shape using kind singleMesh. Use the blueprint category. The app has procedural constructors for bear, house, spaceship, airplane, tree, tower, and abstract. For known categories, parts can be empty because the constructor creates the full recognizable silhouette. For abstract only, include custom parts. Keep color, height, horned, style, position, rotationY, and scale coherent.',
          },
          {
            role: 'user',
            content: `Original request: ${trimmedPrompt}\nBlueprint JSON: ${JSON.stringify(blueprint)}`,
          },
        ],
      })

      setGenerationStatus('Verificando figura')

      const review = await requestOpenAIJson<ModelReview>({
        apiKey: trimmedKey,
        schema: reviewSchema,
        schemaName: 'model_review',
        maxOutputTokens: 700,
        setStatus: setGenerationStatus,
        input: [
          {
            role: 'system',
            content:
              'You are a strict reviewer for primitive 3D models. Decide if the generated model category and required visible parts match the original request and blueprint. For example, an airplane must have fuselage, cockpit, two wings, tail, and landing wheels. Return JSON only. If not approved, suggest the closest supported category and whether horned should be true.',
          },
          {
            role: 'user',
            content: `Original request: ${trimmedPrompt}\nBlueprint JSON: ${JSON.stringify(blueprint)}\nGenerated model JSON: ${JSON.stringify(generatedScene)}`,
          },
        ],
      })

      if (!review.approved && review.score < 0.62) {
        generatedScene.shapes = generatedScene.shapes.map((shape) => ({
          ...shape,
          meshProfile: shape.meshProfile
            ? {
                ...shape.meshProfile,
                category: review.suggestedCategory,
                horned: review.suggestedHorned,
                style: `${shape.meshProfile.style} corrected`.trim(),
              }
            : shape.meshProfile,
        }))
      }

      const generatedShapes = normalizeGeneratedShapes(generatedScene, shapes.length)

      if (!generatedShapes.length) {
        throw new Error('La respuesta no incluyo figuras')
      }

      setShapes((currentShapes) => [...currentShapes, ...generatedShapes])
      setSelectedId(generatedShapes[0].id)
      setGenerationPrompt('')
      setGenerationStatus(review.approved ? 'Modelo agregado y verificado' : `Modelo agregado con ajuste: ${review.missingParts.slice(0, 2).join(', ')}`)
    } catch (error) {
      setGenerationStatus(error instanceof Error ? error.message.slice(0, 120) : 'No se pudo generar')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <main className="editor-page">
      <aside className="editor-toolbar" aria-label="Geometry tools">
        <a href="/" className="editor-home" aria-label="Back to portfolio">
          Portfolio
        </a>

        <section className="editor-tool-section">
          <p>Figuras</p>
          <div className="editor-shape-grid">
            {shapeDefinitions.map(({ Icon, kind, label }) => (
              <button key={kind} type="button" onClick={() => addShape(kind)} title={label} aria-label={label}>
                <Icon />
              </button>
            ))}
          </div>
        </section>

        <section className="editor-tool-section">
          <p>Escena</p>
          <div className="editor-scene-count">
            <FaLayerGroup />
            <span>{shapes.length}</span>
          </div>
        </section>
      </aside>

      <section className="editor-canvas-wrap" aria-label="3D geometry editor">
        <Canvas
          camera={{ fov: 48, position: [7.5, 7.2, 9.5] }}
          dpr={[1, 1.5]}
          gl={{ antialias: true, powerPreference: 'high-performance', stencil: false }}
          shadows={false}
        >
          <Suspense fallback={null}>
            <EditorScene
              draggingId={draggingId}
              onCanvasSelect={() => setSelectedId(null)}
              onDragEnd={() => setDraggingId(null)}
              onDragStart={setDraggingId}
              selectedId={selectedId}
              shapes={shapes}
              updateShape={updateShape}
            />
          </Suspense>
        </Canvas>
      </section>

      <form
        className="editor-ai-panel"
        onSubmit={(event) => {
          event.preventDefault()
          void generateGeometry()
        }}
      >
        <div className="editor-ai-row">
          <input type="password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder="OpenAI API key" autoComplete="off" />
          <button type="submit" disabled={isGenerating}>
            {isGenerating ? '...' : 'Generar'}
          </button>
        </div>
        <textarea
          value={generationPrompt}
          onChange={(event) => setGenerationPrompt(event.target.value)}
          placeholder="Ej. una nave espacial con alas y cabina"
          rows={2}
        />
        {generationStatus ? <p>{generationStatus}</p> : null}
      </form>

      <aside className="editor-properties" aria-label="Shape properties">
        <header>
          <p>Editor 3D</p>
          <h1>Geometría</h1>
        </header>

        {selectedShape ? (
          <>
            <div className="editor-selected-name">
              <FaArrowsAlt />
              <span>
                {selectedShape.kind === 'singleMesh'
                  ? `Modelo ${selectedShape.meshProfile?.category ?? '3D'}`
                  : shapeDefinitions.find((definition) => definition.kind === selectedShape.kind)?.label}
              </span>
            </div>

            <div className="editor-property-grid">
              <NumberField
                label="X"
                value={selectedShape.position[0]}
                onChange={(value) => updateSelected({ position: [value, selectedShape.position[1], selectedShape.position[2]] })}
              />
              <NumberField
                label="Z"
                value={selectedShape.position[2]}
                onChange={(value) => updateSelected({ position: [selectedShape.position[0], selectedShape.position[1], value] })}
              />
              <NumberField
                label="Altura"
                value={selectedShape.position[1]}
                onChange={(value) => updateSelected({ position: [selectedShape.position[0], value, selectedShape.position[2]] })}
              />
              <NumberField label="Escala" value={selectedShape.scale} onChange={(value) => updateSelected({ scale: Math.max(0.2, value) })} />
              <NumberField
                label="Rotacion"
                step={5}
                value={THREE.MathUtils.radToDeg(selectedShape.rotationY)}
                onChange={(value) => updateSelected({ rotationY: THREE.MathUtils.degToRad(value) })}
              />
            </div>

            <div className="editor-color-panel">
              <p>Color</p>
              <div className="editor-swatches">
                {colorSwatches.map((color) => (
                  <button
                    key={color}
                    type="button"
                    aria-label={`Color ${color}`}
                    className={selectedShape.color === color ? 'editor-swatch editor-swatch-active' : 'editor-swatch'}
                    style={{ backgroundColor: color }}
                    onClick={() =>
                      updateSelected({
                        color,
                        meshProfile: selectedShape.meshProfile ? { ...selectedShape.meshProfile, color } : undefined,
                      })
                    }
                  />
                ))}
              </div>
            </div>

            <div className="editor-actions">
              <button type="button" onClick={duplicateSelected}>
                <FaClone />
                <span>Duplicar</span>
              </button>
              <button type="button" onClick={deleteSelected}>
                <FaTrash />
                <span>Eliminar</span>
              </button>
            </div>
          </>
        ) : (
          <div className="editor-empty-state">
            <FaDrawPolygon />
            <p>Selecciona una figura para editarla.</p>
          </div>
        )}
      </aside>
    </main>
  )
}
