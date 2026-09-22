import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {title:'Techer — Your personal tech radar',description:'Discover the technology you care about, and the ideas outside your orbit.',icons:{icon:'/favicon.svg',shortcut:'/favicon.svg'}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="en"><body>{children}</body></html>}
