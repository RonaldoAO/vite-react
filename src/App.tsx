import { Canvas } from '@react-three/fiber'
import { Suspense, useRef } from 'react'
import  {Model}  from './Scene'
import { Environment, OrbitControls } from '@react-three/drei'

function App() {
  const cameraRef = useRef<HTMLCanvasElement | null>(null);
  interface CameraRef {
    position: {
      x: number;
      y: number;
      z: number;
    };
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    console.log("aasdas");
    if (event.key === 'Enter' && cameraRef.current) {
      const { position } = cameraRef.current as unknown as CameraRef;
      console.log(`Camera Position: x=${position.x}, y=${position.y}, z=${position.z}`);
    }
  };
  return (
    <section className='w-full h-screen relative' onKeyDown={ () => handleKeyDown } >
      <p className='absolute text-white z-40 text-center w-full font-semibold text-3xl mt-5 font-mono'>Hi my name's Ronaldo Acevedo</p>
      <Canvas className='w-full h-screen bg-black'
      camera={{ position: [0,1,-3.4]}}
      ref={cameraRef}>
        <OrbitControls/>
        <Suspense fallback={null}>
          
          
          <mesh
                rotation={[0,1.632,0]}
                position={[0,-0.6,-0.9]}
                >
                  <Model/>
                </mesh>
          <directionalLight/>
          <ambientLight/>
          <pointLight/>
          <spotLight/>
          <hemisphereLight/>
          
        </Suspense>
       
      </Canvas>
    </section>
  )
}

export default App
