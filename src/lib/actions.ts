'use server'

// This is a mock authentication - replace with your actual auth logic
export async function login(formData: FormData) {
  const username = formData.get('username')
  const password = formData.get('password')

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Mock validation - replace with your actual validation
  if (username === 'admin' && password === 'password') {
    return { success: true }
  }

  return { error: 'Invalid username or password' }
}

