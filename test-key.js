// Test script to verify private key format works with Google Auth
const { google } = require('googleapis');

// Test with the escaped format
const privateKeyEscaped = `-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDduSQGmb7f4w05\nTCBQpwk5W0cDinNJ4kWhHaOYIO0XTmccnq+MtMpmAj+i/eVwkGIY+psvPQrrZSHS\nG4+kRCOWkkQtTuHtRV2HHseSL8G8qNzlvPGzr9ZgG4yEiAqNjOZFgW7a0q5tNlUs\nnDa3yPP3YFm34N7hnf2PgP8F3yFXwoa8OLvK2bpaXG3h8S0A7MgkZvo2praAocqa\n7Lv5zoDS3s+wMqkAO1gkkmaBnhluJjMBqLgXXqVijdQGv/ir1BnYjNp0au/3JHnF\n4jjzMvPHJWBHp7xYD6aanXf5LRrtmC3JuGb1P7GBbj7VEN62L+f+fN2jIWoFzl76\nqbJDRRH7AgMBAAECggEANvklZoGOIsKPz8oBJR4VGmR4OfeE2CfC7cyEeD6JqkKl\nLCJoEjHtENez4Xyj+4HA4MKZ4V94Kp77gLWWqrq+PCHtx3IMcCDHrK3D+4ndtiIE\nCu4K22tYcqHB+EYmn6v0l/0ceCLOXoOfIJ1mr7CiVI5OEFovyK68ZG0uTc1h3fkF\n0Uwlmkql+uwSNvja9IHE4I+XnAJ9sABVEigRw9VMXyPLi05j/OkJC1zPVCp+riae\nttYNpPMGXkSAa2NbszeggU31th/G+PN252rt7ebRXyc6zKU4lYxdK7YTb7ltEt5f\nlrqBZGQtd1Ugc9kpsIzS6TUc10tleyKoei+OUnVDYQKBgQD7Xgp7Aue/RmE8hb62\ngrK/MKbILmCXUpn0djTaSq+UL5cB1GVFMYRAjNi2Vl4t25iCEP0RyJ8yxabWSAx2\nWveLm28utk67Tjq6SOasH2dLstxrdkWIe9UBH2GI8OnNUSBxa4bN16OdOIW5JhrD\n1XMi3oXdRunoAzBh4wQVGgkhKwKBgQDhzzzgBhgSVsPcGCquXqSEBgjirnxSuMhw\nH5By0aeD8K5ni5RufAiXsFYvg/fD/HfnhfuI5LEO/Zd3P2/zdTfwG9Wbq9/I0ofJ\nbm2D1YBD9TT+5ygMRaU3Zruz9HINBw7JKMSGjuC5p7IXuyFP3ag37gGGXUC+Y9qK\nXkZ2a3VKcQKBgCXfK1ERRP1Ki0flFrDEzE2F9PrgEel6pntwe9IPwphe+y9pYsCk\nDzryfYwrQxFBrp6aFKbjRSkPIm3SeR4z4mwERSISkZYi2TJL3YU9TgDXt+Hw9dT0\nY0lCAx3wvikS+gJcovjMbng3ld4pYYrz098DC8Qk9QThxh5ZZ7oOLCX1AoGAT8jd\nhXohvzkQ8w9G5V1jW5KWSSHFo6TOjW9ZpngVbDT6KnPS+kaw8ofHq/pA7OqjoxZg\nDbpgJR/NCMFNWQQtw5TSILLV2ysn9zAhWddx/pEBLJ+YMt3Yxn5yC99u/NNlkgXp\ninGpTW/HKUNhPcrfyQM7XrJMUfkOGp2839KQGsECgYEA3RdoazM+E8TNUFqo1nwd\nfYKT5jPQUmTKE1cRYBf61gutwjWFMz0d++zPwsa4L1p7BztCwqaXkrybCuszSC9v\ndKl6kZ0ugT0DN+l/psgAlu41k5NfFXBFWsI1mDVFlV/I14NWE9+6o4lqDT9eY7XI\nr4m7Q6lG9hTOAFUWgm4UHqo=\n-----END PRIVATE KEY-----`;

async function testPrivateKey() {
  try {
    console.log('Testing escaped private key format...');
    
    // Convert escaped newlines to actual newlines
    const processedKey = privateKeyEscaped.replace(/\\n/g, '\n');
    
    console.log('Processed key starts with:', processedKey.substring(0, 30));
    console.log('Processed key ends with:', processedKey.substring(processedKey.length - 30));
    console.log('Key has newlines:', processedKey.includes('\n'));
    console.log('Key line count:', processedKey.split('\n').length);
    
    // Try to create Google Auth instance
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: 'workoutchallenge@workoutchallenge-447318.iam.gserviceaccount.com',
        private_key: processedKey,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    // Try to get an access token
    const authClient = await auth.getClient();
    console.log('✅ Private key format is valid!');
    console.log('Auth client created successfully');
    
    return true;
  } catch (error) {
    console.error('❌ Private key test failed:', error.message);
    return false;
  }
}

testPrivateKey(); 