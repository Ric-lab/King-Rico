import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeBase,rewritePreviewPaths} from '../scripts/preview-base.mjs';
const roots=['assets','ui','runtime','circus','park','Fortune Circus.dc.html','Fortune%20Circus.dc.html'];
test('preview relocation changes site URLs without touching separators, APIs or external URLs',()=>{
 const source=`<a href="/park">x</a><a href="/">Home</a><img src="/assets/a.webp">url(/assets/bg.webp)\nconst a='/circus?demo=tony',b='/Fortune%20Circus.dc.html'; const c='/api/play',d='https://other/assets/a',e='/'; a.split('/');`;
 const result=rewritePreviewPaths(source,'/King-Rico',roots);
 for(const expected of['href="/King-Rico/park"','href="/King-Rico/"','src="/King-Rico/assets/a.webp"','url(/King-Rico/assets/bg.webp)',"'/King-Rico/circus?demo=tony'","'/King-Rico/Fortune%20Circus.dc.html'","c='/api/play'","d='https://other/assets/a'","e='/'","a.split('/')"])assert.ok(result.includes(expected),expected);
 assert.equal(rewritePreviewPaths(result,'/King-Rico',roots),result);
 assert.equal(rewritePreviewPaths(source,'',roots),source);
});
test('only safe repository subpaths are accepted',()=>{
 assert.equal(normalizeBase('/King-Rico/'),'/King-Rico');assert.equal(normalizeBase('/'),'');
 for(const bad of['King-Rico','/../x','/a/../../b','//host','/a?x','/a"b'])assert.throws(()=>normalizeBase(bad));
});
