/** A school exam paper (UASA): marks per question, "choose one" sections and marking by the scheme's bands, in BM. */
import { expect, test } from './fixtures';

test('a UASA paper is sat, totalled out of its marks and marked with the scheme', async ({ page }) => {
  test.slow();
  await page.goto('/courses/bm-f1');
  const papers = page.getByRole('region', { name: 'UASA (Ujian Akhir Sesi Akademik)' });
  await expect(papers.getByText('2 bahagian, 40 markah, 60 minit').first()).toBeVisible();

  await page.goto('/courses/bm-f1/assessments/bm-f1.uasa-2223-k2');
  await page.getByRole('button', { name: 'Start section 1' }).click();
  await expect(page.getByText('[10 markah]')).toBeVisible();
  const essay = page.getByRole('textbox', { name: 'Your answer' });
  await essay.fill('Program kitar semula diadakan di sekolah kami pada hari Sabtu.');
  await expect(page.getByText(/patah perkataan \(50 hingga 80\)/u)).toBeVisible();
  await page.getByRole('button', { name: 'Finish section' }).click();

  // Bahagian B: one of three questions.
  await expect(page.getByText('Jawab 1 soalan sahaja.')).toBeVisible();
  await expect(page.getByText('0 / 1 marked')).toBeVisible();
  await page.getByRole('textbox', { name: 'Your answer' }).nth(1).fill('Pada hari Sabtu, saya dan adik bermain di belakang rumah.');
  await page.getByRole('button', { name: 'Finish exam' }).click();

  const score = page.getByRole('region', { name: 'Score' });
  await expect(score.getByText('/ 40')).toBeVisible();
  await expect(score.getByText('2 answers wait for your review below and are not counted yet.')).toBeVisible();

  // Mark the short essay with the scheme: the scheme's points first, then a mark from a band.
  const first = page.getByRole('region', { name: 'Feedback' }).first();
  await expect(first.getByRole('heading', { name: 'Tanda jawapan anda dengan panduan penskoran' })).toBeVisible();
  await expect(first.getByText('Panduan penskoran', { exact: true })).toBeVisible();
  await first.getByRole('group', { name: 'Idea dan bahasa: Cemerlang' }).getByRole('button', { name: '8' }).click();
  await expect(first.getByText('Jumlah: 8 / 10')).toBeVisible();
  await first.getByRole('button', { name: 'Sahkan markah saya' }).click();
  await expect(score.getByText('1 answer waits for your review below and is not counted yet.')).toBeVisible();
  await expect(score.getByRole('row', { name: /Bahagian A/u })).toContainText('8 / 10');
});
