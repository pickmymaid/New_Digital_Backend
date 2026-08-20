import moment from 'moment'

export const adminLoginMailBody = (name: string) => {
  return `
  <html>
    <body>
      <p>
      Dear Super Admin,<br /><br/>

      This is to inform you that a user has logged in to the admin panel.
      <br /><br />
      <b>User Details:</b><br /><br />
      Name: ${name}<br />
      Logged In Time: ${moment().format('DD/MM/YYYY HH:mm')}<br />
      </p>
    <body>
  <html>
 
  
`
}