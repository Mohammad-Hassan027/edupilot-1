const requests = new Map()

export function rateLimit(userId:string){

  const now = Date.now()

  if(!requests.has(userId)){
    requests.set(userId,[now])
    return true
  }

  const logs = requests.get(userId)

  const recent = logs.filter(
    time => now - time < 60000
  )

  if(recent.length > 20){
    return false
  }

  recent.push(now)

  requests.set(userId,recent)

  return true
}