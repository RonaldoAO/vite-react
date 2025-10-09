import { Canvas } from '@react-three/fiber'
import { Suspense, useRef, useState, useEffect } from 'react'
import  {Model}  from './Modelo'
import {  OrbitControls, Html } from '@react-three/drei'

function Loader() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCount(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + Math.floor(Math.random() * 15) + 5;
      });
    }, 150);

    return () => clearInterval(interval);
  }, []);

  return (
    <Html center>
      <div className='flex flex-col items-center justify-center'>
        <div className='text-white font-mono'>
          <div className='text-8xl font-bold mb-4'>{Math.min(count, 100)}%</div>
          <div className='text-2xl tracking-widest'>CARGANDO...</div>
        </div>
      </div>
    </Html>
  );
}

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
        <Suspense fallback={<Loader />}>
          
          
          <mesh
                rotation={[0,1.632,0]}
                position={[0,-0.6,-0.9]}
                >
                  <Model/>
                </mesh>
          
          <ambientLight/>
          
          
          <hemisphereLight intensity={0.5}/>
          
        </Suspense>
       
      </Canvas>
    </section>
  )
}

export default App
