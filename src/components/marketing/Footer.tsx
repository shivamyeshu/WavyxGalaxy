import { Linkedin, Github } from "lucide-react";

// X (Twitter) icon
const XIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
);

const Footer = () => {
    const socialLinks = [
        { icon: Linkedin, href: "https://www.linkedin.com/in/shivam-yeshu/" },
        { icon: XIcon, href: "https://x.com/Shivam_01Kumar", isCustom: true },
        { icon: Github, href: "https://github.com/shivamyeshu" },
    ];

    const footerLinks = {
        getStarted: [
            { label: "REQUEST A DEMO", href: "#" },
            { label: "PRICING", href: "#" },
            { label: "ENTERPRISE", href: "#" },
        ],
        company: [
            { label: "ABOUT", href: "#" },
            { label: "PRIVACY", href: "#" },
        ],
        connect: [{ label: "COLLECTIVE", href: "#" }],
        resources: [{ label: "KNOWLEDGE CENTER", href: "#" }],
    };

    return (
        <footer className="bg-[#2b2d2a] pt-16 md:pt-24 overflow-hidden relative z-10">
            {/* Wrapper for the right margin gap */}
            <div className="mr-0 lg:mr-[140px] relative">
                
                {/* Main sage-colored container */}
                <div className="bg-[#565955] rounded-tr-[60px] md:rounded-tr-[100px] px-6 md:px-16 lg:px-24 pt-20 md:pt-28 pb-8 text-white relative min-h-[850px]">
                    <div className="max-w-[1400px] mx-auto w-full">
                        {/* Headline Section */}
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-12 mb-28 md:mb-40">
                            <h2 className="text-[clamp(3rem,8vw,5.5rem)] font-normal leading-[0.95] tracking-[-0.02em] text-white">
                                Artificial<br />Intelligence
                            </h2>
                            <span className="text-[clamp(2rem,5vw,4rem)] font-extralight text-white/70 hidden md:block">+</span>
                            <h2 className="text-[clamp(3rem,8vw,5.5rem)] font-normal leading-[0.95] tracking-[-0.02em] text-white">
                                Human<br />Creativity
                            </h2>
                        </div>

                        {/* Logo & Description Row */}
                        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8 lg:gap-16 mb-14 pb-14 border-b border-white/20">
                            <div className="flex items-center gap-4 shrink-0">
                                <span className="font-semibold text-2xl tracking-tight leading-none">Weavy</span> 
                                <div className="h-8 w-px bg-white/40 mx-2" />
                                <span className="text-[10px] font-semibold tracking-[0.2em] leading-tight uppercase text-white/90">
                                    ARTISTIC<br />INTELLIGENCE
                                </span>
                            </div>
                            <p className="text-sm leading-relaxed max-w-md text-white/80">
                                Weavy is a new way to create. We&apos;re bridging the gap between AI capabilities and human creativity, to continue the tradition of craft in artistic expression.
                            </p>
                        </div>

                        {/* Links Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-y-8 gap-x-6 mb-16">
                            <div className="flex flex-col gap-2.5">
                                <h4 className="text-white/50 text-[10px] font-medium uppercase tracking-[0.15em] mb-2">Get Started</h4>
                                {footerLinks.getStarted.map((link, i) => (
                                    <a key={i} href={link.href} className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white hover:text-white/70 transition-colors">{link.label}</a>
                                ))}
                            </div>
                            <div className="flex flex-col gap-2.5">
                                <h4 className="text-white/50 text-[10px] font-medium uppercase tracking-[0.15em] mb-2">Company</h4>
                                {footerLinks.company.map((link, i) => (
                                    <a key={i} href={link.href} className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white hover:text-white/70 transition-colors">{link.label}</a>
                                ))}
                            </div>
                            <div className="flex flex-col gap-2.5">
                                <h4 className="text-white/50 text-[10px] font-medium uppercase tracking-[0.15em] mb-2">Connect</h4>
                                {footerLinks.connect.map((link, i) => (
                                    <a key={i} href={link.href} className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white hover:text-white/70 transition-colors">{link.label}</a>
                                ))}
                            </div>
                            <div className="flex flex-col gap-2.5">
                                <h4 className="text-white/50 text-[10px] font-medium uppercase tracking-[0.15em] mb-2">Resources</h4>
                                {footerLinks.resources.map((link, i) => (
                                    <a key={i} href={link.href} className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white hover:text-white/70 transition-colors">{link.label}</a>
                                ))}
                            </div>
                            <div className="flex gap-5 items-start col-span-2">
                                {socialLinks.map((social, i) => (
                                    <a key={i} href={social.href} className="text-white/80 hover:text-white transition-colors">
                                        {social.isCustom ? <social.icon /> : <social.icon size={16} strokeWidth={2} />}
                                    </a>
                                ))}
                            </div>
                        </div>

                        <div className="w-40 h-px bg-white/30 mb-10" />
                        <p className="text-[10px] font-semibold tracking-[0.15em] uppercase text-[#111]/50 mt-4">
                            WEAVY © 2026. <span className="ml-6">ALL RIGHTS RESERVED.</span>
                        </p>
                    </div>

                    {/* Decorative curve stays inside the gray area */}
                    <div className="absolute bottom-24 right-0 w-48 h-48 md:w-72 md:h-72 pointer-events-none hidden lg:block">
                        <svg viewBox="0 0 200 200" fill="none" className="w-full h-full">
                            <path d="M200 0 C200 110, 110 200, 0 200" stroke="white" strokeWidth="1" fill="none" opacity="0.4" />
                        </svg>
                    </div>
                </div>

                {/* 2. START NOW BUTTON - NOW OUTSIDE AND POSITIONED TO THE FAR RIGHT EDGE */}
                <div className="absolute bottom-0 right-0 lg:-right-[140px] z-50">
                    <a 
                        href="/workflows"
                        className="block bg-yellow-100 text-[#111] text-2xl md:text-4xl lg:text-6xl font-light px-16 md:px-24 py-10 md:py-16 rounded-tl-[60px] md:rounded-tl-[100px] hover:brightness-110 transition-all leading-none cursor-pointer whitespace-nowrap border-b-0 border-r-0"
                    >
                        Start Now
                    </a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;