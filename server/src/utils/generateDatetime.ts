import moment from 'moment-timezone';

export const generateDatetime = (timezone: string = 'Asia/Dubai'): string => {
  return moment().tz(timezone).format('YYYY-MM-DD HH:mm:ss');
};
