/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef } from 'react';
import { DraggableCardContainer, DraggableCardBody } from './ui/draggable-card';
import { cn } from '../lib/utils';
import type { PanInfo } from 'framer-motion';

type ImageStatus = 'pending' | 'done' | 'error';

interface PolaroidCardProps {
    imageUrl?: string;
    caption: string;
    status: ImageStatus;
    error?: string;
    dragConstraintsRef?: React.RefObject<HTMLElement>;
    onShake?: (caption: string) => void;
    onDownload?: (caption: string) => void;
    isMobile?: boolean;
}

const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="relative w-12 h-12">
            <div className="absolute inset-0 border-4 border-white/20 border-t-lime-400 rounded-full animate-spin"></div>
        </div>
        <span className="font-do-hyeon text-white/70 animate-pulse">AI가 그리는 중...</span>
    </div>
);

const ErrorDisplay = () => (
    <div className="flex flex-col items-center justify-center h-full text-red-400 gap-2">
         <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="font-do-hyeon">실패했어요 ㅠ</span>
    </div>
);

const Placeholder = () => (
    <div className="flex flex-col items-center justify-center h-full text-white/30 group-hover:text-white/80 transition-colors duration-300 gap-3">
        <div className="p-4 rounded-full bg-white/5 border-2 border-dashed border-white/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        </div>
        <span className="font-black-han text-xl">사진 업로드</span>
    </div>
);


const PolaroidCard: React.FC<PolaroidCardProps> = ({ imageUrl, caption, status, error, dragConstraintsRef, onShake, onDownload, isMobile }) => {
    const lastShakeTime = useRef(0);
    const lastVelocity = useRef({ x: 0, y: 0 });

    const handleDragStart = () => {
        lastVelocity.current = { x: 0, y: 0 };
    };

    const handleDrag = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (!onShake || isMobile) return;

        const velocityThreshold = 1500;
        const shakeCooldown = 2000;
        const { x, y } = info.velocity;
        const { x: prevX, y: prevY } = lastVelocity.current;
        const now = Date.now();

        const magnitude = Math.sqrt(x * x + y * y);
        const dotProduct = (x * prevX) + (y * prevY);

        if (magnitude > velocityThreshold && dotProduct < 0 && (now - lastShakeTime.current > shakeCooldown)) {
            lastShakeTime.current = now;
            onShake(caption);
        }

        lastVelocity.current = { x, y };
    };

    const cardInnerContent = (
        <>
            <div className="w-full flex-grow relative overflow-hidden group rounded-2xl bg-black/40 border border-white/10">
                {status === 'pending' && <LoadingSpinner />}
                {status === 'error' && <ErrorDisplay />}
                {status === 'done' && imageUrl && (
                    <>
                        <div className={cn(
                            "absolute top-2 right-2 z-20 flex flex-col gap-2 transition-opacity duration-300",
                            !isMobile && "opacity-0 group-hover:opacity-100",
                        )}>
                            {onDownload && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation(); 
                                        onDownload(caption);
                                    }}
                                    className="p-2 bg-black/60 backdrop-blur rounded-full text-white hover:bg-lime-400 hover:text-black transition-colors"
                                    title="다운로드"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                </button>
                            )}
                             {isMobile && onShake && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onShake(caption);
                                    }}
                                    className="p-2 bg-black/60 backdrop-blur rounded-full text-white hover:bg-lime-400 hover:text-black transition-colors"
                                    title="다시 만들기"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.899 2.186l-1.42.71a5.002 5.002 0 00-8.479-1.554H10a1 1 0 110 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm12 14a1 1 0 01-1-1v-2.101a7.002 7.002 0 01-11.899-2.186l1.42-.71a5.002 5.002 0 008.479 1.554H10a1 1 0 110-2h6a1 1 0 011 1v6a1 1 0 01-1 1z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            )}
                        </div>

                        {/* Image */}
                        <img
                            src={imageUrl}
                            alt={caption}
                            className="w-full h-full object-cover animate-in fade-in duration-700"
                        />
                        
                        {/* Glossy overlay */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-50 pointer-events-none mix-blend-overlay"></div>
                    </>
                )}
                {status === 'done' && !imageUrl && <Placeholder />}
            </div>
            <div className="mt-4 mb-1 text-center px-2">
                <p className={cn(
                    "font-do-hyeon text-2xl tracking-wide drop-shadow-md",
                    status === 'done' && imageUrl ? 'text-lime-400' : 'text-neutral-500'
                )}>
                    #{caption}
                </p>
            </div>
        </>
    );

    const containerClasses = "bg-white/10 backdrop-blur-lg border border-white/20 !p-4 !pb-4 flex flex-col items-center justify-start aspect-[3/4] w-72 max-w-full rounded-3xl shadow-[0_0_30px_rgba(0,0,0,0.3)]";

    if (isMobile) {
        return (
            <div className={containerClasses + " relative"}>
                {cardInnerContent}
            </div>
        );
    }

    return (
        <DraggableCardContainer>
            <DraggableCardBody 
                className={containerClasses}
                dragConstraintsRef={dragConstraintsRef}
                onDragStart={handleDragStart}
                onDrag={handleDrag}
            >
                {cardInnerContent}
            </DraggableCardBody>
        </DraggableCardContainer>
    );
};

export default PolaroidCard;