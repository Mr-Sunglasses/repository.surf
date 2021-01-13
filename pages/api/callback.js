import { fetchAndWait, postAndWait } from 'lib/fetchWrapper'
import { supabase } from 'lib/auth'
const CryptoJS = require('crypto-js')

const usersTable = process.env.NEXT_PUBLIC_SUPABASE_USERS_TABLE
const githubClientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID
const githubClientSecret = process.env.GITHUB_CLIENT_SECRET

export default async function callback(req, res) {
  const code = req.query.code
  const url = `https://github.com/login/oauth/access_token?client_id=${githubClientId}&client_secret=${githubClientSecret}&code=${code}`

  const result = await postAndWait(url)
  if (result.error) {
    console.error("Failed to retrieve GH access token")
  } else {
    const githubUserProfile = await fetchAndWait(
      `https://api.github.com/user`,
      { 'Authorization': `token ${result.access_token}` }
    )
  
    const { error } = await supabase
      .from(usersTable)
      .update({
        name: githubUserProfile.name,
        access_token: CryptoJS.AES.encrypt(
          result.access_token,
          process.env.REPOSITORY_SURF_ENCRYPTION_KEY
        ).toString()
      })
    
    if (error) console.error(error)
  }

  res.redirect('http://localhost:3000/settings')
}