/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const REMIX_IDEAS = [
    "위인전 속 인물 되어보기",
    "우리 반 캐릭터 만들기",
    "미래의 내 모습 상상하기",
    "좋아하는 동화 주인공 되기",
    "감정 표현 놀이하기",
    "나만의 웹툰 캐릭터 만들기",
];

const Footer = () => {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setIndex(prevIndex => (prevIndex + 1) % REMIX_IDEAS.length);
        }, 3500); 

        return () => clearInterval(intervalId);
    }, []);

    return (
        <footer className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-lg p-3 z-50 text-neutral-400 text-xs sm:text-sm border-t border-white/10">
            <div className="max-w-screen-xl mx-auto flex justify-between items-center gap-4 px-4">
                {/* Left Side */}
                <div className="hidden md:flex items-center gap-4 whitespace-nowrap font-do-hyeon">
                    <p>Powered by Gemini 2.5</p>
                </div>

                {/* Right Side */}
                <div className="flex-grow flex justify-end items-center gap-4 sm:gap-6">
                    <div className="hidden lg:flex items-center gap-2 text-neutral-400 text-right min-w-0 font-do-hyeon">
                        <span className="flex-shrink-0">선생님, 이것도 해보세요:</span>
                        <div className="relative w-52 h-5">
                            <AnimatePresence mode="wait">
                                <motion.span
                                    key={index}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.4, ease: "easeInOut" }}
                                    className="absolute inset-0 text-lime-400 whitespace-nowrap text-left"
                                >
                                    {REMIX_IDEAS[index]}
                                </motion.span>
                            </AnimatePresence>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 sm:gap-6">
                        <a
                            href="https://aistudio.google.com/apps"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-black-han text-sm sm:text-base text-center text-black bg-lime-400 py-2 px-4 rounded-full transform transition-transform duration-200 hover:scale-105 hover:shadow-[0_0_10px_rgba(163,230,53,0.5)] whitespace-nowrap"
                        >
                            더 많은 앱 보기
                        </a>
                        <a
                            href="https://gemini.google.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-black-han text-sm sm:text-base text-center text-white bg-white/10 backdrop-blur-sm border border-white/20 py-2 px-4 rounded-full transform transition-transform duration-200 hover:scale-105 hover:bg-white hover:text-black whitespace-nowrap"
                        >
                            Gemini와 대화하기
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;