import assert from 'node:assert/strict';
import {parseOEmbed,xPostId} from './lib/x-post.ts';
assert.equal(xPostId('https://x.com/author/status/123/photo/1'),'123');assert.equal(xPostId('https://x.com.evil.org/author/status/123'),null);assert.equal(xPostId('javascript:alert(1)'),null);
const p=parseOEmbed({author_name:'Author',html:'<blockquote><p>Hello &amp; world<br><br>Second line &lt;script&gt;literal&lt;/script&gt;</p></blockquote>'},'123');assert.equal(p.text,'Hello & world\n\nSecond line <script>literal</script>');assert.equal(p.truncated,false);
assert.equal(parseOEmbed({author_name:'A',html:'<p>Long text… <a href="https://t.co/abc">pic.twitter.com/abc</a></p>'},'1').truncated,true);
assert.throws(()=>parseOEmbed({author_name:'A',html:'<script>alert(1)</script>'},'1'));
console.log('PASS: host/ID validation, safe plain-text extraction, line breaks/entities, truncation detection, malformed response rejection');
