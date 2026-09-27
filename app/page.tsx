import RadarApp from '@/components/radar-app';
import {LoginScreen} from '@/components/login-screen';
import {authenticatedUser} from '@/lib/auth-server';
export const dynamic='force-dynamic';
export default async function Page(){const user=await authenticatedUser();if(user)return <RadarApp/>;return <LoginScreen enabled={process.env.TECHER_GOOGLE_AUTH_ENABLED==='true'}/>}
