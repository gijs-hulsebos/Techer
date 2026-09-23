'use client';
import {useEffect,useState} from 'react';
import type {RankModel,TrainingState} from '@/lib/personal-model';
export type ModelStatus={active:RankModel|null;state:TrainingState|null;available:number;invalidated:boolean;history:{created_at:string;state:TrainingState}[]};
export function usePersonalModel(){const [data,setData]=useState<ModelStatus|null>(null);useEffect(()=>{let live=true;const load=()=>{fetch('/api/model',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json()}).then(d=>{if(live)setData(d)}).catch(()=>{if(live)setData(null)})};load();const timer=setInterval(load,300000);window.addEventListener('focus',load);return()=>{live=false;clearInterval(timer);window.removeEventListener('focus',load)}},[]);return data}
