"use client"
import Button from "./button";
import AnimatedSphere from "./AnimatedSphere";
import { useRouter } from 'next/navigation'
// 主页面主文案
export default function Hero() {
    // css类名区域
    const section = 'w-full min-h-[calc(100vh-100px)] flex flex-col md:flex-row items-center justify-between px-6 md:px-24 py-12 gap-12 md:pt-0 pb-0 pt-24';
    
    const left = 'flex flex-col gap-8 align-center';
    const lup = 'space-y-4';
    const welcome = 'text-[#007AFF] font-bold text-sm tracking-widest uppercase';
    const title = 'md:text-6xl font-extrabold text-gray-900 leading-tight mb-[-10px]';
    const headerSchoolFont = 'text-[#007AFF]';
    
    const lbottom = 'space-y-3 max-w-xl';
    const font = 'text-base font-bold text-gray-800';
    const smfont = 'text-sm text-gray-500';

    const right = 'flex-1 w-full flex justify-center items-center hidden md:block';

    const router = useRouter();

    return (
        <section className={section}>
            {/* 左侧内容区 */}
            <div className={left}>
                <div className={lup}>
                    <p className={welcome}>WELCOME!!</p>
                    <h1 className={title}>
                        <p className="md:text-5xl text-4xl">欢迎来到</p>
                        <span className={headerSchoolFont}>科成</span>
                        开放原子开源社团
                    </h1>
                </div>
                <div className={lbottom}>
                    <p className={font}>
                        Welcome to the Open-Atom-Club station of Kecheng University,
                        <br />
                        a dedicated navigation station for club members' learning and exchange.
                    </p>
                    <p className={smfont}>
                        In here, you can communicate with your peers, share knowledge, and collaborate on projects.
                    </p>
                </div>

                <div className="pt-4">
                    <Button onClick={() => router.push('/home')}>
                        点击进入
                    </Button>
                </div>

            </div>
            {/* 右侧球形区域 */}
            <div className={right}>
                <AnimatedSphere />
            </div>
        </section>
    )
}
