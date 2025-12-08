import React, { useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const LandingPage = () => {
    const navigate = useNavigate();
    const mobileMenuRef = useRef(null);

    const toggleMobileMenu = () => {
        if (mobileMenuRef.current) {
            mobileMenuRef.current.classList.toggle('hidden');
        }
    };

    return (
        <>
            {/* Navigation */}
            <nav className="glass-nav fixed w-full z-50 transition-all duration-300">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    
                    {/* Samrion Brand Identity (Logo + Nitin Raj Name) - Uses Link */}
                    <Link to="/" className="flex items-center space-x-3 group cursor-pointer">
                        {/* Samrion S Logo (Inline SVG) */}
                        <div className="h-10 w-10 bg-samrion-red rounded-lg flex items-center justify-center shadow-lg shadow-red-900/50 transition duration-300 group-hover:scale-105">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16.5 12.75a4.5 4.5 0 11-9 0m9 0H3m14.5 0H21m-2.5 0a4.5 4.5 0 00-9 0" />
                            </svg>
                        </div>
                        <div className="hidden md:block">
                            <span className="text-xs uppercase tracking-widest text-slate-400">Project by</span>
                            <h2 className="font-bold text-lg leading-none text-white">Nitin Raj <span className="text-samrion-red text-xs">(Samrion)</span></h2>
                        </div>
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex space-x-8 text-sm font-semibold tracking-wide">
                        <a href="#mission" className="hover:text-pragyan-blue transition">Mission</a>
                        <a href="#roadmap" className="hover:text-pragyan-blue transition">Roadmap</a>
                        <Link to="/payment" className="text-pragyan-blue hover:text-white transition">Support Us</Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <button className="md:hidden text-2xl text-white" onClick={toggleMobileMenu}>
                        <i className="fa-solid fa-bars"></i>
                    </button>
                </div>

                {/* Mobile Menu Dropdown */}
                <div ref={mobileMenuRef} className="hidden md:hidden bg-bg-card border-b border-slate-700">
                    <div className="flex flex-col p-4 space-y-4 text-center">
                        <a href="#mission" className="block hover:text-pragyan-blue">Mission</a>
                        <a href="#roadmap" className="block hover:text-pragyan-blue">Roadmap</a>
                        <Link to="/payment" className="block text-samrion-red font-bold">Donate Now</Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 overflow-hidden">
                <div className="hero-glow absolute inset-0 z-0 pointer-events-none"></div>
                
                <div className="container mx-auto text-center relative z-10" data-aos="fade-up">
                    {/* Project Logo (Pragyan Image) */}
                    <div className="mx-auto mb-8 h-24 w-24 md:h-32 md:w-32 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(14,165,233,0.3)] rotate-3 hover:rotate-0 transition-all duration-500">
                        <img src="./assets/pragyan_logo.png" alt="Pragyan AI Logo" className="w-full h-full object-cover"/>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-display font-bold mb-4 tracking-tight">
                        Pragyan <span className="text-pragyan-blue">AI</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-slate-400 mb-8 max-w-2xl mx-auto">
                        Building India’s First Community-Driven<br/> Open Source AI Model.
                    </p>
                    
                    <div className="flex flex-col md:flex-row justify-center items-center gap-4">
                        {/* EDITED LINK: Redirects to React Payment route */}
                        <Link to="/payment" className="px-8 py-4 bg-samrion-red hover:bg-red-700 text-white rounded-full font-bold text-lg transition-all transform hover:scale-105 shadow-lg shadow-red-900/50 flex items-center gap-2">
                            <i className="fa-solid fa-heart"></i> Contribute Now (UPI)
                        </Link>
                        <a href="https://github.com/nitinxaiml-pragyanai/Pragyan-AI" target="_blank" rel="noopener noreferrer" className="px-8 py-4 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white rounded-full font-bold text-lg transition-all flex items-center gap-2">
                            <i className="fa-brands fa-github"></i> View Source Code
                        </a>
                    </div>

                    <div className="mt-12 flex justify-center items-center gap-8 text-slate-500 text-sm font-mono">
                        <span><i className="fa-solid fa-check text-green-500 mr-2"></i>Open Source</span>
                        <span><i className="fa-solid fa-check text-green-500 mr-2"></i>Indigenous</span>
                        <span><i className="fa-solid fa-check text-green-500 mr-2"></i>Transparent</span>
                    </div>
                </div>
            </header>

            {/* Why This Matters Section */}
            <section id="mission" className="py-20 bg-bg-card border-y border-slate-800">
                <div className="container mx-auto px-6">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div data-aos="fade-right">
                            <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">Why <span className="text-gradient">Pragyan</span> Matters?</h2>
                            <p className="text-slate-300 leading-relaxed mb-4 text-lg">
                                India currently depends on foreign AI systems like GPT, Claude, and Gemini. If we don’t build our own, we will depend on foreign companies, foreign data policies, and foreign control.
                            </p>
                            <p className="text-slate-300 leading-relaxed mb-6 text-lg">
                                I am an independent developer building a fully open-source model pipeline to ensure India becomes self-reliant in AI.
                            </p>
                            <div className="bg-bg-main p-6 rounded-xl border border-slate-700">
                                <h3 className="font-bold text-white mb-2"><i className="fa-solid fa-user text-pragyan-blue mr-2"></i> Who Am I?</h3>
                                <p className="text-sm text-slate-400">
                                    "My name is <span className="text-white font-semibold">Nitin Raj</span>. I have no big company behind me. No sponsors. Just a laptop, a dream, and the support of people like you."
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4" data-aos="fade-left">
                            <div className="bg-bg-main p-6 rounded-2xl border border-slate-700 hover:border-pragyan-blue transition-colors text-center">
                                <i className="fa-solid fa-database text-3xl text-pragyan-blue mb-3"></i>
                                <h4 className="font-bold">Data Sovereignty</h4>
                            </div>
                            <div className="bg-bg-main p-6 rounded-2xl border border-slate-700 hover:border-pragyan-blue transition-colors text-center">
                                <i className="fa-solid fa-language text-3xl text-pragyan-blue mb-3"></i>
                                <h4 className="font-bold">Indian Languages</h4>
                            </div>
                            <div className="bg-bg-main p-6 rounded-2xl border border-slate-700 hover:border-pragyan-blue transition-colors text-center">
                                <i className="fa-solid fa-code text-3xl text-pragyan-blue mb-3"></i>
                                <h4 className="font-bold">Open Source</h4>
                            </div>
                            <div className="bg-bg-main p-6 rounded-2xl border border-slate-700 hover:border-pragyan-blue transition-colors text-center">
                                <i className="fa-solid fa-shield-halved text-3xl text-pragyan-blue mb-3"></i>
                                <h4 className="font-bold">Transparency</h4>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* The Roadmap (Timeline) */}
            <section id="roadmap" className="py-20 relative">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-display font-bold">The Journey to <span className="text-gradient">Ultra</span></h2>
                        <p className="text-slate-400 mt-4">We are climbing the ladder of intelligence, one model at a time.</p>
                    </div>

                    <div className="relative timeline-line max-w-3xl mx-auto">
                        {/* Step 1: DONE */}
                        <div className="relative flex md:justify-center items-center mb-12 pl-12 md:pl-0" data-aos="zoom-in">
                            <div className="absolute left-0 md:left-1/2 transform md:-translate-x-1/2 w-8 h-8 bg-green-500 rounded-full border-4 border-bg-main z-10 flex items-center justify-center">
                                <i className="fa-solid fa-check text-bg-main text-xs"></i>
                            </div>
                            <div className="bg-bg-card p-6 rounded-xl border border-green-500/50 shadow-lg w-full md:w-5/12 ml-auto md:ml-0 md:mr-auto">
                                <h3 className="font-bold text-green-400 text-lg">1. Nano Model (1–10M)</h3>
                                <p className="text-sm text-slate-400 mt-1">Foundation built. Proof of concept operational.</p>
                                <span className="inline-block mt-2 px-2 py-1 bg-green-900/30 text-green-400 text-xs rounded border border-green-800">Completed</span>
                            </div>
                        </div>

                        {/* Step 2: NEXT */}
                        <div className="relative flex md:justify-center items-center mb-12 pl-12 md:pl-0" data-aos="zoom-in">
                            <div className="absolute left-0 md:left-1/2 transform md:-translate-x-1/2 w-8 h-8 bg-pragyan-blue rounded-full border-4 border-bg-main z-10 shadow-[0_0_15px_#0EA5E9]"></div>
                            <div className="bg-gradient-to-r from-bg-card to-slate-800 p-6 rounded-xl border border-pragyan-blue shadow-lg w-full md:w-5/12 mr-auto md:mr-0 md:ml-auto text-right md:text-left">
                                <h3 className="font-bold text-white text-xl">2. Mini Model</h3>
                                <p className="text-sm text-slate-300 mt-1">Requiring GPU compute. The next big milestone.</p>
                                <span className="inline-block mt-2 px-2 py-1 bg-pragyan-blue text-black font-bold text-xs rounded animate-pulse">Current Goal</span>
                            </div>
                        </div>

                        {/* Step 3: FUTURE */}
                        <div className="relative flex md:justify-center items-center pl-12 md:pl-0" data-aos="fade-up">
                            <div className="absolute left-0 md:left-1/2 transform md:-translate-x-1/2 w-8 h-8 bg-slate-700 rounded-full border-4 border-bg-main z-10"></div>
                            <div className="bg-bg-card p-6 rounded-xl border border-slate-700 w-full md:w-5/12 ml-auto md:ml-0 md:mr-auto opacity-70">
                                <h3 className="font-bold text-slate-300 text-lg">3. Base Model & Beyond</h3>
                                <p className="text-sm text-slate-500 mt-1">The path to India's GPT-Class Intelligence.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            
            {/* Contribution Callout */}
            <section id="contribute" className="py-16 bg-bg-card border-y border-slate-800">
                <div className="container mx-auto px-6 text-center" data-aos="fade-up">
                    <h2 className="text-3xl font-display font-bold mb-4">Support the Mission</h2>
                    <p className="text-xl text-slate-400 mb-6">
                        Your contribution directly funds the GPU compute needed for the Mini-Model.
                    </p>
                    {/* EDITED LINK: Redirects to React Payment route */}
                    <Link to="/payment" className="inline-flex items-center gap-3 px-10 py-4 bg-pragyan-blue hover:bg-blue-500 text-slate-900 rounded-full font-bold text-lg transition-all transform hover:scale-105 shadow-lg shadow-pragyan-blue/40">
                        <i className="fa-solid fa-hand-holding-heart"></i> See Contribution Tiers
                    </Link>
                </div>
            </section>


            {/* Footer */}
            <footer className="bg-bg-main py-12 border-t border-slate-900">
                <div className="container mx-auto px-6 text-center">
                    
                    <p className="text-xl font-display font-bold text-white mb-6">
                        "Let’s build India’s AI future — together."
                    </p>

                    <p className="text-slate-600 text-sm">
                        Project Pragyan by Nitin Raj. Open Source.<br/>
                    </p>
                </div>
            </footer>
        </>
    );
};

export default LandingPage;
