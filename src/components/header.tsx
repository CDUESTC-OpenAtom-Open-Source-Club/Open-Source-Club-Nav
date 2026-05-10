"use client"
import Link from 'next/link'
import { ChevronRight } from "lucide-react";
import { useState } from "react";
import Image from 'next/image';
import logolink from '../assets/logo.png';

// header组件: 导航栏
export default function Header() {
    const navItems = [
      { English: "HOME", name: '首页', href: '/home' },
      { English: "PLATFORM", name: '学习/咨询平台', href: '#' }, 
      { English: "LINKS", name: '友情链接', href: '#' },
      { English: "ABOUT", name: '关于本站', href: '#' }, 
      { English: "CONTACT", name: '联系我们', href: '#' }
    ];

    // 样式taiwindCSS
    const header = 'w-full bg-white/90 backdrop-blur-sm sticky top-0 z-50';
    const tophr = 'w-full h-[2px] bg-gradient-to-r from-transparent via-[#007AFF] to-transparent opacity-60';
    
    const logo_title = 'flex items-center gap-2';
    const logo = 'w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center'
    const title = 'font-bold text-xl tracking-tight';

    const nav = 'w-full py-5 px-4 md:px-12 flex justify-between items-center';
    const chevron = 'flex items-center gap-2';
    const left_chevron = 'flex gap-1 text-[#007AFF]';
    const pcnav = 'hidden md:flex gap-10';
    const links = 'flex flex-col items-center group';
    const english = 'text-[10px] font-bold text-gray-400 group-hover:text-[#007AFF] transition-colors tracking-widest';
    const name = 'text-sm font-medium text-gray-800 group-hover:text-[#007AFF] transition-colors';
  
    // 汉堡按钮
    const [isOpen, setIsOpen] = useState(false);
    const burgerBtn = "md:hidden flex flex-col justify-center items-center w-9 h-9 gap-1.5 rounded-lg hover:bg-gray-100 transition-colors";
    const bar = "w-5 h-0.5 bg-gray-600 rounded-full transition-all duration-300 origin-center";

    // 移动端下拉抽屉
    const drawer = "md:hidden overflow-hidden transition-all duration-300 ease-in-out";
    const drawerInner = "px-4 pb-4 pt-2 flex flex-col gap-1";
    const mobileLink = "flex items-center justify-between px-4 py-3 rounded-xl hover:bg-sky-50 transition-colors group";
    const mobileLinkLeft = "flex flex-col";
    const mobileEnglish = "text-[10px] font-bold text-gray-400 group-hover:text-[#007AFF] transition-colors tracking-widest";
    const mobileName = "text-sm font-medium text-gray-800 group-hover:text-[#007AFF] transition-colors";
    const mobileChevron = "text-gray-300 group-hover:text-[#007AFF] transition-colors";

    const bottomhr = 'w-full h-[1px] bg-gray-200';
    
    return (
    <header className={header}>
        <div className={tophr}></div>
        {/* 导航栏区 */}
        <div className={nav}>
            {/* Logo 区域 */}
            <div className={chevron}>
                <div className={left_chevron}>
                    <ChevronRight size={16} strokeWidth={3} className="-mr-2" />
                    <ChevronRight size={16} strokeWidth={3} />
                </div>
                <div className={logo_title}>
                    <div className={logo}>
                        <Image src={logolink} alt="logo"/>
                    </div>
                    <span className={title}>开放原子开源社团 - 导航站</span>
                </div>
            </div>
            {/* pc导航栏 */}
            <nav className={pcnav}>
                {navItems.map((item, index) => (
                    <Link 
                    key={index} 
                    href={item.href} 
                    className={links}
                    >
                        <span className={english}>{item.English}</span>
                        <span className={name}>{item.name}</span>
                    </Link>
                ))}
                <div className="flex items-center text-gray-400">
                    <ChevronRight size={20} />
                </div>
            </nav>
            <button
                className={burgerBtn}
                onClick={() => setIsOpen((o) => !o)}
                aria-label={isOpen ? "关闭菜单" : "打开菜单"}>
                {/* 三条横线 → 点击后变 X */}
                <span
                    className={bar}
                    style={{
                    transform: isOpen ? "rotate(45deg) translateY(11px)" : "none",
                    }}
                />
                <span
                    className={bar}
                    style={{
                    opacity: isOpen ? 0 : 1,
                    transform: isOpen ? "scaleX(0)" : "none",
                    }}
                />
                <span
                    className={bar}
                    style={{
                    transform: isOpen ? "rotate(-45deg) translateY(-12px)" : "none",
                    }}
                />
            </button>
        </div>
        <div className={drawer} style={{ maxHeight: isOpen ? "400px" : "0px" }}>
            <div className={drawerInner}>
            {navItems.map((item, index) => (
                <a
                key={index}
                href={item.href}
                className={mobileLink}
                onClick={() => setIsOpen(false)}
                >
                <div className={mobileLinkLeft}>
                    <span className={mobileEnglish}>{item.English}</span>
                    <span className={mobileName}>{item.name}</span>
                </div>
                <ChevronRight size={16} className={mobileChevron} />
                </a>
            ))}
            </div>
        </div>
        <div className={bottomhr}></div>
    </header>
  )
}