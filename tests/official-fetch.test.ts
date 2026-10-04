import { it, expect, vi } from 'vitest';
import { fetchOficial, validateOfficialUrl } from '../src/services/official-fetch';
it.each(['https://example.org','https://cdn.tse.jus.br.evil.test','http://cdn.tse.jus.br','https://cdn.tse.jus.br:444','https://user@cdn.tse.jus.br'])('bloqueia %s', url => expect(() => validateOfficialUrl(url)).toThrow());
it('bloqueia endereço fornecido em lugar de recurso', async () => {
  const fetcher = vi.fn(); await expect(fetchOficial('https://example.org' as 'configuration',{fetcher})).rejects.toThrow(); expect(fetcher).not.toHaveBeenCalled();
});
it('bloqueia redirecionamento externo antes de requisitá-lo', async () => {
  const fetcher = vi.fn().mockResolvedValue(new Response(null,{ status:302,headers:{location:'https://example.org'} }));
  await expect(fetchOficial('configuration',{fetcher})).rejects.toThrow('não permitida'); expect(fetcher).toHaveBeenCalledOnce();
});
it('aceita redirecionamento oficial, com limite', async () => {
  const fetcher = vi.fn().mockResolvedValueOnce(new Response(null,{status:302,headers:{location:'/oficial/comum/config/ele-c.json'}})).mockResolvedValueOnce(new Response('{}'));
  expect(Buffer.from(await fetchOficial('configuration',{fetcher})).toString()).toBe('{}');
  const loop = vi.fn().mockImplementation(() => Promise.resolve(new Response(null,{status:302,headers:{location:'/loop'}})));
  await expect(fetchOficial('configuration',{fetcher:loop})).rejects.toThrow('Limite'); expect(loop).toHaveBeenCalledTimes(4);
});
it.each([true,false])('limita tamanho com ou sem Content-Length (%s)', async declared => {
  const fetcher = vi.fn().mockResolvedValue(new Response('12345',{headers: declared ? {'content-length':'5'} : {}}));
  await expect(fetchOficial('configuration',{fetcher,maxBytes:4})).rejects.toThrow('excede limite');
});
it('timeout cancela acesso', async () => {
  const fetcher = vi.fn<typeof fetch>().mockImplementation((_url,init) => new Promise((_resolve,reject) => init!.signal!.addEventListener('abort',()=>reject(init!.signal!.reason))));
  await expect(fetchOficial('configuration',{fetcher,timeoutMs:10})).rejects.toThrow('Tempo limite');
});
