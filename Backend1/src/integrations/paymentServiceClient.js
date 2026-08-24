const axios = require('axios');

// Internal DNS/service name of Backend2 (auth+payment), e.g. in
// docker-compose this is the service name "backend2"; in k8s it's the
// Service name "backend2".
const BACKEND2_URL = process.env.BACKEND2_URL || 'http://backend2:8081';

const verifyPayment = async (ref, user_id) => {
  const response = await axios.post(
    `${BACKEND2_URL}/internal/verify-payment`,
    { ref, user_id },
    {
      headers: {
        'x-internal-token': process.env.INTERNAL_SERVICE_TOKEN,
      },
      timeout: 10000,
    }
  );
  return response.data?.data;
};

module.exports = { verifyPayment };
