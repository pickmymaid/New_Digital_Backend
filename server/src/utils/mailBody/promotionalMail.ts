import { generateDatetime } from "../generateDatetime";
import { experienceCalculator } from "../maids/experienceCalculator";

export const promotionalMailBody = (maids: any[], email: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Maid Promotion Email</title>
</head>
<body style="margin:0; padding:0; font-family:Arial, sans-serif; background-color:#f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; margin:auto; background-color:#ffffff;">
    
    <!-- Row 1: Logo and Date -->
    <tr>
      <td style="padding:1rem 1rem; display:flex; justify-content:space-between; align-items:center;">
        <table width="100%" style="border-collapse:collapse;">
          <tr>
            <td align="left">
              <img src="cid:logo@pickmymaid" alt="Logo" style="display:block; max-height:40px;">
            </td>
            <td align="right" style="color:#555; font-size:0.9rem;">
              ${generateDatetime()}
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Row 2: Main Heading -->
    <tr>
      <td style="background-color:#FF7442; color:#ffffff; padding:1.5rem; text-align:center;">
        <h1 style="margin:0; font-size:1.5rem;">Find Your Perfect Maid/Nanny Today</h1>
      </td>
    </tr>

    <!-- Row 3: Subtitle -->
    <tr>
      <td style="padding:1rem; text-align:center; background-color:#ffffff;">
        <p style="margin:0; font-size:1rem; color:#333;">
          Choose from our top-rated Maids/Nannies based on your preferences for experience, salary, and nationality.
        </p>
      </td>
    </tr>

    <!-- Maid Card Template -->
    <!-- Repeat this block for each maid -->

    ${
      maids.map((maid, index) => `
        <tr>
          <td style="padding:0.3rem;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #ddd; border-radius:8px; overflow:hidden;">
              <tr>
                <td style="text-align:center; padding: 0.5rem;">
                  <img src="cid:maid${index}@image" alt="Maid Image" style="width:7rem; height:8rem; object-fit:cover; border-radius:8px;">
                </td>

                <td style="padding:0.5rem; text-align:left;">
                  <h2 style="margin:0; font-size:0.95rem; color:#333;">${maid.name}</h2>
                  <p style="margin:0.5rem 0; font-size:0.85rem;">Salary: AED ${maid.salary?.from ?? ''} to ${maid.salary?.to ?? ''}</p>
                  <p style="margin:0.5rem 0; font-size:0.85rem;">Experience: ${experienceCalculator(maid.employmentHistory)} years</p>
                  <p style="margin:0.5rem 0; font-size:0.85rem;">Nationality: ${maid.nationality}</p>
                  <a href="https://www.pickmymaid.com/maid/maid-name/${maid.ref_number}" style="display:inline-block; margin-top:0.5rem; padding:0.5rem 1rem; background-color:#FF7442; color:#fff; text-decoration:none; border-radius:4px; font-size:0.9rem;">View Profile</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `).join('')
    }

    <!-- Repeat Row 4-6 here for more maids -->
    
    <!-- Row 7: View All Button -->
    <tr>
      <td style="text-align:center; padding:2rem;">
        <a href="https://www.pickmymaid.com/search" style="display:inline-block; padding:0.75rem 1.5rem; background-color:#FF7442; color:#ffffff; text-decoration:none; border-radius:4px; font-weight:bold;">
          View All Profile
        </a>
      </td>
    </tr>
    <tr>
      <td style="text-align:center;">
        </hr>
      </td>
    </tr>
    <tr>
      <td style="text-align:center; font-size: 9px;">
        Don’t want to receive these emails? <a href="https://api.pickmymaid.com/api/v2/auth/unsubscribe?user=${email}">Unsubscribe</a>.
      </td>
    </tr>
  </table>
</body>
</html>
`