/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, ChangeEvent, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { generateDecadeImage } from './services/geminiService';
import PolaroidCard from './components/PolaroidCard';
import { createAlbumPage } from './lib/albumUtils';
import Footer from './components/Footer';

// Define the emotions with English keys for the API and Korean labels for the UI
const EMOTIONS = [
    { id: 'joy', label: '핵인싸 웃음', promptAdjective: 'overjoyed, laughing uncontrollably, extremely happy, ROFL' },
    { id: 'sadness', label: '광광 우럭', promptAdjective: 'crying dramatic tears, very sad, gloomy, heartbroken' },
    { id: 'anger', label: '극대노', promptAdjective: 'furious, angry, fire in eyes, red face, steam coming out of ears' },
    { id: 'surprise', label: 'ㄴ0ㄱ 상상불가', promptAdjective: 'shocked, mind blown, wide eyes, jaw dropped, exploding head gesture' },
    { id: 'love', label: '심쿵 주의', promptAdjective: 'deeply in love, heart eyes, floating hearts, romantic blush' },
    { id: 'confused', label: '동공 지진', promptAdjective: 'confused, dizzy eyes, question marks, scratching head, bewildered' },
];

// Pre-defined positions for a scattered look on desktop
const POSITIONS = [
    { top: '5%', left: '10%', rotate: -5 },
    { top: '15%', left: '60%', rotate: 3 },
    { top: '45%', left: '5%', rotate: 2 },
    { top: '2%', left: '35%', rotate: 6 },
    { top: '40%', left: '70%', rotate: -8 },
    { top: '50%', left: '38%', rotate: -2 },
];

const GHOST_POLAROIDS_CONFIG = [
  { initial: { x: "-150%", y: "-100%", rotate: -30 }, transition: { delay: 0.2 } },
  { initial: { x: "150%", y: "-80%", rotate: 25 }, transition: { delay: 0.4 } },
  { initial: { x: "-120%", y: "120%", rotate: 45 }, transition: { delay: 0.6 } },
  { initial: { x: "180%", y: "90%", rotate: -20 }, transition: { delay: 0.8 } },
  { initial: { x: "0%", y: "-200%", rotate: 0 }, transition: { delay: 0.5 } },
  { initial: { x: "100%", y: "150%", rotate: 10 }, transition: { delay: 0.3 } },
];


type ImageStatus = 'pending' | 'done' | 'error';
interface GeneratedImage {
    status: ImageStatus;
    url?: string;
    error?: string;
}

// New trendy button styles
const primaryButtonClasses = "font-black-han text-xl tracking-wider text-center text-black bg-gradient-to-r from-lime-400 to-green-400 py-4 px-10 rounded-full transform transition-all duration-200 hover:scale-105 hover:shadow-[0_0_20px_rgba(163,230,53,0.6)] active:scale-95 border-2 border-black shadow-[4px_4px_0px_0px_#ffffff]";
const secondaryButtonClasses = "font-black-han text-xl tracking-wider text-center text-white bg-black/40 backdrop-blur-md border-2 border-white/50 py-4 px-10 rounded-full transform transition-all duration-200 hover:scale-105 hover:bg-white hover:text-black hover:shadow-[0_0_15px_rgba(255,255,255,0.5)] active:scale-95";

const useMediaQuery = (query: string) => {
    const [matches, setMatches] = useState(false);
    useEffect(() => {
        const media = window.matchMedia(query);
        if (media.matches !== matches) {
            setMatches(media.matches);
        }
        const listener = () => setMatches(media.matches);
        window.addEventListener('resize', listener);
        return () => window.removeEventListener('resize', listener);
    }, [matches, query]);
    return matches;
};

function App() {
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [generatedImages, setGeneratedImages] = useState<Record<string, GeneratedImage>>({});
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isDownloading, setIsDownloading] = useState<boolean>(false);
    const [appState, setAppState] = useState<'idle' | 'image-uploaded' | 'generating' | 'results-shown'>('idle');
    const dragAreaRef = useRef<HTMLDivElement>(null);
    const isMobile = useMediaQuery('(max-width: 768px)');


    const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setUploadedImage(reader.result as string);
                setAppState('image-uploaded');
                setGeneratedImages({}); // Clear previous results
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGenerateClick = async () => {
        if (!uploadedImage) return;

        setIsLoading(true);
        setAppState('generating');
        
        const initialImages: Record<string, GeneratedImage> = {};
        EMOTIONS.forEach(emotion => {
            initialImages[emotion.label] = { status: 'pending' };
        });
        setGeneratedImages(initialImages);

        const concurrencyLimit = 2; // Process two emotions at a time
        const emotionsQueue = [...EMOTIONS];

        const processEmotion = async (emotionItem: typeof EMOTIONS[0]) => {
            try {
                // Prompt engineered for trendy 3D character/emoji style
                const prompt = `Turn the person in this photo into a trendy, high-quality 3D Pixar-style character or glossy 3D sticker art. The character is expressing the emotion: ${emotionItem.promptAdjective}. The facial expression must be exaggerated and funny. Lighting should be studio quality with rim lighting. Background should be a simple, vibrant solid pop color.`;
                const resultUrl = await generateDecadeImage(uploadedImage, prompt);
                setGeneratedImages(prev => ({
                    ...prev,
                    [emotionItem.label]: { status: 'done', url: resultUrl },
                }));
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "오류 발생";
                setGeneratedImages(prev => ({
                    ...prev,
                    [emotionItem.label]: { status: 'error', error: errorMessage },
                }));
                console.error(`Failed to generate image for ${emotionItem.label}:`, err);
            }
        };

        const workers = Array(concurrencyLimit).fill(null).map(async () => {
            while (emotionsQueue.length > 0) {
                const emotion = emotionsQueue.shift();
                if (emotion) {
                    await processEmotion(emotion);
                }
            }
        });

        await Promise.all(workers);

        setIsLoading(false);
        setAppState('results-shown');
    };

    const handleRegenerateEmotion = async (label: string) => {
        if (!uploadedImage) return;

        const emotionItem = EMOTIONS.find(e => e.label === label);
        if (!emotionItem) return;

        if (generatedImages[label]?.status === 'pending') {
            return;
        }
        
        console.log(`Regenerating image for ${label}...`);

        setGeneratedImages(prev => ({
            ...prev,
            [label]: { status: 'pending' },
        }));

        try {
             const prompt = `Turn the person in this photo into a trendy, high-quality 3D Pixar-style character or glossy 3D sticker art. The character is expressing the emotion: ${emotionItem.promptAdjective}. The facial expression must be exaggerated and funny. Lighting should be studio quality with rim lighting. Background should be a simple, vibrant solid pop color.`;
            const resultUrl = await generateDecadeImage(uploadedImage, prompt);
            setGeneratedImages(prev => ({
                ...prev,
                [label]: { status: 'done', url: resultUrl },
            }));
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "오류 발생";
            setGeneratedImages(prev => ({
                ...prev,
                [label]: { status: 'error', error: errorMessage },
            }));
            console.error(`Failed to regenerate image for ${label}:`, err);
        }
    };
    
    const handleReset = () => {
        setUploadedImage(null);
        setGeneratedImages({});
        setAppState('idle');
    };

    const handleDownloadIndividualImage = (label: string) => {
        const image = generatedImages[label];
        if (image?.status === 'done' && image.url) {
            const link = document.createElement('a');
            link.href = image.url;
            link.download = `emoji-${label}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleDownloadAlbum = async () => {
        setIsDownloading(true);
        try {
            const imageData = Object.entries(generatedImages)
                .filter(([, image]) => (image as GeneratedImage).status === 'done' && (image as GeneratedImage).url)
                .reduce((acc, [label, image]) => {
                    const img = image as GeneratedImage;
                    if (img.url) {
                        acc[label] = img.url;
                    }
                    return acc;
                }, {} as Record<string, string>);

            if (Object.keys(imageData).length < EMOTIONS.length) {
                alert("이모티콘이 아직 생성 중이야! 잠시만 기다려줘!");
                return;
            }

            const albumDataUrl = await createAlbumPage(imageData);

            const link = document.createElement('a');
            link.href = albumDataUrl;
            link.download = 'my-emoji-collection.jpg';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (error) {
            console.error("Failed to create or download album:", error);
            alert("저장 중에 문제가 생겼어. 다시 시도해봐!");
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <main className="bg-[#09090b] text-white min-h-screen w-full flex flex-col items-center justify-center p-4 pb-24 overflow-hidden relative selection:bg-lime-400 selection:text-black">
            {/* Dynamic Background Blobs */}
            <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-purple-600/30 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-blue-600/30 rounded-full blur-[120px] animate-pulse delay-1000"></div>
            
            <div className="z-10 flex flex-col items-center justify-center w-full h-full flex-1 min-h-0 relative">
                <div className="text-center mb-10 relative">
                    <motion.h1 
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="text-6xl md:text-8xl font-black-han text-transparent bg-clip-text bg-gradient-to-br from-lime-400 via-white to-cyan-400 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                    >
                        나만의 이모티콘
                    </motion.h1>
                    <motion.p 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="font-do-hyeon text-neutral-400 mt-4 text-2xl tracking-wide"
                    >
                        내 얼굴로 만드는 3D 캐릭터 스티커
                    </motion.p>
                    <div className="absolute -right-8 -top-8 rotate-12 hidden md:block">
                        <span className="bg-pink-500 text-white font-black-han px-3 py-1 text-sm transform -rotate-6 inline-block shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-white">
                            AI 탑재!
                        </span>
                    </div>
                </div>

                {appState === 'idle' && (
                     <div className="relative flex flex-col items-center justify-center w-full">
                        {/* Ghost cards for intro animation */}
                        {GHOST_POLAROIDS_CONFIG.map((config, index) => (
                             <motion.div
                                key={index}
                                className="absolute w-64 h-80 rounded-3xl bg-white/5 border border-white/10 blur-sm backdrop-blur-md"
                                initial={config.initial}
                                animate={{
                                    x: "0%", y: "0%", rotate: (Math.random() - 0.5) * 20,
                                    scale: 0,
                                    opacity: 0,
                                }}
                                transition={{
                                    ...config.transition,
                                    ease: "circOut",
                                    duration: 2,
                                }}
                            />
                        ))}
                        <motion.div
                             initial={{ opacity: 0, scale: 0.8 }}
                             animate={{ opacity: 1, scale: 1 }}
                             transition={{ delay: 2, duration: 0.8, type: 'spring' }}
                             className="flex flex-col items-center"
                        >
                            <label htmlFor="file-upload" className="cursor-pointer group">
                                 <div className="relative">
                                     <PolaroidCard 
                                         caption="사진을 선택해줘!"
                                         status="done"
                                     />
                                     <div className="absolute -bottom-6 right-0 bg-cyan-400 text-black font-black-han px-4 py-2 rounded-full text-lg transform rotate-6 group-hover:scale-110 transition-transform border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                                        CLICK ME!
                                     </div>
                                 </div>
                            </label>
                            <input id="file-upload" type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleImageUpload} />
                        </motion.div>
                    </div>
                )}

                {appState === 'image-uploaded' && uploadedImage && (
                    <div className="flex flex-col items-center gap-8">
                         <div className="transform rotate-2 hover:rotate-0 transition-transform duration-300">
                             <PolaroidCard 
                                imageUrl={uploadedImage} 
                                caption="원본 사진" 
                                status="done"
                             />
                         </div>
                         <div className="flex flex-col sm:flex-row items-center gap-4 mt-4">
                            <button onClick={handleGenerateClick} className={primaryButtonClasses}>
                                ✨ AI로 변신하기
                            </button>
                            <button onClick={handleReset} className={secondaryButtonClasses}>
                                다시 고르기
                            </button>
                         </div>
                    </div>
                )}

                {(appState === 'generating' || appState === 'results-shown') && (
                     <>
                        {isMobile ? (
                            <div className="w-full max-w-sm flex-1 overflow-y-auto mt-4 space-y-8 p-4 no-scrollbar">
                                {EMOTIONS.map((emotion) => (
                                    <div key={emotion.label} className="flex justify-center">
                                         <PolaroidCard
                                            caption={emotion.label}
                                            status={generatedImages[emotion.label]?.status || 'pending'}
                                            imageUrl={generatedImages[emotion.label]?.url}
                                            error={generatedImages[emotion.label]?.error}
                                            onShake={handleRegenerateEmotion}
                                            onDownload={handleDownloadIndividualImage}
                                            isMobile={isMobile}
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div ref={dragAreaRef} className="relative w-full max-w-6xl h-[600px] mt-4 border-2 border-dashed border-white/10 rounded-3xl bg-white/5">
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <span className="font-black-han text-8xl text-white/5">DRAG ME</span>
                                </div>
                                {EMOTIONS.map((emotion, index) => {
                                    const { top, left, rotate } = POSITIONS[index];
                                    return (
                                        <motion.div
                                            key={emotion.label}
                                            className="absolute cursor-grab active:cursor-grabbing z-20 hover:z-50"
                                            style={{ top, left }}
                                            initial={{ opacity: 0, scale: 0.5, y: 100, rotate: 0 }}
                                            animate={{ 
                                                opacity: 1, 
                                                scale: 1, 
                                                y: 0,
                                                rotate: `${rotate}deg`,
                                            }}
                                            transition={{ type: 'spring', stiffness: 100, damping: 20, delay: index * 0.15 }}
                                        >
                                            <PolaroidCard 
                                                dragConstraintsRef={dragAreaRef}
                                                caption={emotion.label}
                                                status={generatedImages[emotion.label]?.status || 'pending'}
                                                imageUrl={generatedImages[emotion.label]?.url}
                                                error={generatedImages[emotion.label]?.error}
                                                onShake={handleRegenerateEmotion}
                                                onDownload={handleDownloadIndividualImage}
                                                isMobile={isMobile}
                                            />
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                         <div className="h-24 mt-6 flex items-center justify-center z-30">
                            {appState === 'results-shown' && (
                                <div className="flex flex-col sm:flex-row items-center gap-4">
                                    <button 
                                        onClick={handleDownloadAlbum} 
                                        disabled={isDownloading} 
                                        className={`${primaryButtonClasses} disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-pink-500 to-purple-500 text-white border-white shadow-[4px_4px_0px_0px_#222] hover:shadow-[0_0_20px_rgba(236,72,153,0.6)]`}
                                    >
                                        {isDownloading ? '저장 중...' : '📁 앨범 통째로 저장'}
                                    </button>
                                    <button onClick={handleReset} className={secondaryButtonClasses}>
                                        처음으로
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
            <Footer />
        </main>
    );
}

export default App;