// These checks receive only server-verified Supabase user identities.
export function hasGoogleIdentity(user:{identities?:{provider:string}[]}|null|undefined){
 return !!user?.identities?.some(identity=>identity.provider==='google');
}
export function assertExpectedAccount(actual:string,expected:unknown){
 if(typeof expected!=='string'||expected!==actual)throw Error('ACCOUNT_CHANGED');
}
