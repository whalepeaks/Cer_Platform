import { formatInTimeZone } from 'date-fns-tz';

export const toKSTString = (date) => {
  if (!date) return '';
  // 'yyyy-MM-dd HH:mm:ss' 형식으로 한국 시간대(Asia/Seoul)의 시간을 반환
  return formatInTimeZone(date, 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
};