import type {Metadata,Viewport} from 'next';
import './globals.css';
export const metadata:Metadata={title:'Techer',description:'Swipe door de selectie van Robert Scoble via Aligned News.',icons:{icon:'/favicon.svg',shortcut:'/favicon.svg'},appleWebApp:{capable:true,title:'Techer',statusBarStyle:'black-translucent'}};
export const viewport:Viewport={width:'device-width',initialScale:1,viewportFit:'cover',themeColor:'#101010'};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="nl"><body>{children}</body></html>}
