import RadarApp from '@/components/radar-app';
import {authenticatedUser} from '@/lib/auth-server';
export const dynamic='force-dynamic';
export default async function Page() {
 const user=await authenticatedUser();if(user)return <RadarApp />;
 const enabled=process.env.TECHER_GOOGLE_AUTH_ENABLED==='true';
 return <main className="login-page"><div className="wordmark">techer<span>/</span><small>TECH TINDER</small></div><h1>Jouw volgende<br/>tech-ontdekking.</h1><p>Log in om je swipes, leeslijst en voorkeuren bij elkaar te houden.</p>{enabled?<a className="primary" href="/auth/login">Doorgaan met Google</a>:<div className="login-pending">Google-login wordt ingesteld.<br/><small>Je bestaande gegevens blijven bewaard.</small></div>}</main>;
}
