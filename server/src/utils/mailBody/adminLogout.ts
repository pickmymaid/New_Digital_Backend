import moment from 'moment'

export const adminLogoutBody = (name: string) => {
  return `
  <html>
    <body>
      <p>
      Dear Super Admin,<br />

      This is to inform you that a ${name} has logged out from the admin panel.
      <br /><br />
      User Details:<br /><br />
      Name: ${name}<br />
      Logged out Time: ${moment().format('DD/MM/YYYY HH:mm')}<br />
      </p>
    <body>
  <html>
 
  
`
}