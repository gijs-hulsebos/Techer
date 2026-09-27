import type {Metadata,Viewport} from 'next';
import './globals.css';
import {cookies} from 'next/headers';
import {LanguageProvider} from '@/lib/i18n';
import type {Language} from '@/lib/i18n';
export const metadata:Metadata={title:'Techer',description:'Swipe door de selectie van Robert Scoble via Aligned News.',icons:{icon:'/favicon.svg',shortcut:'/favicon.svg'},appleWebApp:{capable:true,title:'Techer',statusBarStyle:'black-translucent'}};
export const viewport:Viewport={width:'device-width',initialScale:1,viewportFit:'cover',themeColor:'#101010'};
export default async function RootLayout({children}:Readonly<{children:React.ReactNode}>){const saved=(await cookies()).get('techer-language')?.value;const language:Language=['en','fr','de','nl'].includes(saved??'')?saved as Language:'en';return <html lang={language}><body><LanguageProvider initialLanguage={language}>{children}</LanguageProvider></body></html>}
