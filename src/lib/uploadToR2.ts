export const uploadToR2 = async (file: File, key: string): Promise<string> => {
  const res = await fetch('/api/files/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename: key,
      contentType: file.type
    })
  })

  if (!res.ok) throw new Error('获取上传地址失败')

  const { signedUrl, publicUrl } = await res.json()

  const putRes = await fetch(signedUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type
    },
    body: file
  })

  if (!putRes.ok) throw new Error('上传失败')

  return publicUrl
}
