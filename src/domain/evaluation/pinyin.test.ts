import { describe, expect, it } from 'vitest';
import { comparePinyin, formatSyllable, parsePinyin, SYLLABLES, toMarkedPinyin } from './pinyin';

describe('syllable inventory', () => {
  it('generates the standard syllables (412, all attested in CC-CEDICT)', () => {
    expect(SYLLABLES.size).toBe(412);
    for (const valid of ['a', 'er', 'yo', 'ri', 'zhi', 'zhuang', 'shuang', 'lve', 'nv', 'ju', 'yuan', 'weng', 'dia', 'miu', 'den', 'shei']) {
      expect(SYLLABLES.has(valid), valid).toBe(true);
    }
  });

  it('excludes combinations that do not exist', () => {
    for (const invalid of ['bou', 'fai', 'ten', 'rai', 'jv', 'nui', 'gia', 'dua', 'si1', 'qv', 'zhong1', 'ying2']) {
      expect(SYLLABLES.has(invalid), invalid).toBe(false);
    }
  });
});

describe('parsePinyin', () => {
  const bases = (input: string) => parsePinyin(input)?.map((s) => `${s.base}${s.tone ?? ''}`).join(' ');

  it('reads tone marks, tone numbers and unspaced words the same way', () => {
    expect(bases('nǐ hǎo')).toBe('ni3 hao3');
    expect(bases('ni3 hao3')).toBe('ni3 hao3');
    expect(bases('ni3hao3')).toBe('ni3 hao3');
    expect(bases('nǐhǎo')).toBe('ni3 hao3');
    expect(bases('Běijīng')).toBe('bei3 jing1');
  });

  it('keeps tones unknown when none are given, and neutral when others are', () => {
    expect(bases('ni hao')).toBe('ni hao');
    expect(bases('dōngxi')).toBe('dong1 xi5');
    expect(bases('ma5')).toBe('ma5');
  });

  it('segments ambiguous strings the way pinyin orthography intends', () => {
    expect(bases('xian1')).toBe('xian1');
    expect(bases("xī'ān")).toBe('xi1 an1');
    expect(bases('xīān')).toBe('xi1 an1'); // two tone marks force two syllables
    expect(bases('fangan')).toBe('fan gan');
  });

  it('reads the breve as the third tone, as Chinese typesetting prints it', () => {
    expect(bases('xiăojiě')).toBe('xiao3 jie3');
    expect(bases('liăng')).toBe('liang3');
  });

  it('accepts ü as ü, v or u:', () => {
    expect(bases('nǚ')).toBe('nv3');
    expect(bases('nv3')).toBe('nv3');
    expect(bases('nu:3')).toBe('nv3');
    expect(bases('lüè')).toBe('lve4');
    expect(bases('qù')).toBe('qu4');
  });

  it('handles erhua', () => {
    expect(bases('yìdiǎnr')).toBe('yi4 dian3 r');
    expect(bases('na3r')).toBe('na3 r');
  });

  it('accepts interjections only as whole words', () => {
    expect(bases('hm')).toBe('hm');
    expect(parsePinyin('nim')).toBeNull();
  });

  it('rejects non-pinyin input', () => {
    expect(parsePinyin('你好')).toBeNull();
    expect(parsePinyin('hello')).toBeNull();
    expect(parsePinyin('')).toBeNull();
  });
});

describe('formatting', () => {
  it('places tone marks by the standard rules', () => {
    expect(formatSyllable({ base: 'hao', tone: 3 })).toBe('hǎo');
    expect(formatSyllable({ base: 'lv', tone: 4 })).toBe('lǜ');
    expect(formatSyllable({ base: 'liu', tone: 2 })).toBe('liú');
    expect(formatSyllable({ base: 'gui', tone: 4 })).toBe('guì');
    expect(formatSyllable({ base: 'xue', tone: 2 })).toBe('xué');
    expect(formatSyllable({ base: 'dou', tone: 1 })).toBe('dōu');
    expect(formatSyllable({ base: 'ma', tone: 5 })).toBe('ma');
  });

  it('converts tone numbers to marks', () => {
    expect(toMarkedPinyin('ni3 hao3')).toBe('nǐ hǎo');
    expect(toMarkedPinyin('na3r')).toBe('nǎr');
    expect(toMarkedPinyin('nv3 er2')).toBe('nǚ ér');
  });
});

describe('comparePinyin', () => {
  it('accepts tone numbers for a tone-marked answer', () => {
    expect(comparePinyin('ni3 hao3', 'nǐ hǎo').verdict).toBe('correct');
    expect(comparePinyin('NǏ HǍO', 'nǐ hǎo').verdict).toBe('correct');
  });

  it('flags missing tones', () => {
    expect(comparePinyin('ni hao', 'nǐ hǎo').verdict).toBe('missing-tones');
    expect(comparePinyin('ni hao', 'nǐ hǎo', false).verdict).toBe('correct');
  });

  it('explains which tone is wrong', () => {
    const result = comparePinyin('ni2 hao3', 'nǐ hǎo');
    expect(result.verdict).toBe('tone-slip');
    expect(result.messages[0]).toContain('ní should be nǐ');
  });

  it('treats a full tone on a neutral syllable as a tone slip', () => {
    const result = comparePinyin('dong1xi1', 'dōngxi');
    expect(result.verdict).toBe('tone-slip');
    expect(result.messages[0]).toContain('neutral tone');
  });

  it('recognises a missing umlaut', () => {
    expect(comparePinyin('nu3', 'nǚ').verdict).toBe('u-umlaut-slip');
  });

  it('reports wrong syllables and character input', () => {
    const wrong = comparePinyin('zong1', 'zhōng');
    expect(wrong.verdict).toBe('different');
    expect(wrong.messages[0]).toContain('zhōng');
    expect(comparePinyin('你好', 'nǐ hǎo')).toMatchObject({ verdict: 'not-pinyin' });
  });
});
