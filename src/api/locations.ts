import { apiRequest } from './client'
import type { ApiData, City, State } from './types'

export function listStates(): Promise<ApiData<State[]>> {
  return apiRequest('/states')
}

export function listCities(stateId: number): Promise<ApiData<City[]>> {
  return apiRequest(`/states/${stateId}/cities`)
}
