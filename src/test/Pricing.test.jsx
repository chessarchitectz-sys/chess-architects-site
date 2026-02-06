import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import App from '../App'

// Mock fetch for geolocation API
global.fetch = vi.fn()

describe('Geolocation Pricing Tests', () => {
  beforeEach(() => {
    fetch.mockClear()
  })

  it('should display Indian prices when user is in India', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({ country_code: 'IN' })
    })

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText(/₹1500/)).toBeInTheDocument()
      expect(screen.getByText(/₹1800/)).toBeInTheDocument()
      expect(screen.getByText(/₹2200/)).toBeInTheDocument()
    })
  })

  it('should display Singapore prices when user is in Singapore', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({ country_code: 'SG' })
    })

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText(/S\$100/)).toBeInTheDocument()
      expect(screen.getByText(/S\$125/)).toBeInTheDocument()
      expect(screen.getByText(/S\$150/)).toBeInTheDocument()
    })
  })

  it('should display UAE prices when user is in UAE', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({ country_code: 'AE' })
    })

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText(/AED 399/)).toBeInTheDocument()
      expect(screen.getByText(/AED 499/)).toBeInTheDocument()
      expect(screen.getByText(/AED 599/)).toBeInTheDocument()
    })
  })

  it('should default to Indian prices when geolocation fails', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'))

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText(/₹1500/)).toBeInTheDocument()
    })
  })

  it('should default to Indian prices for unsupported countries', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({ country_code: 'US' })
    })

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText(/₹1500/)).toBeInTheDocument()
    })
  })
})

describe('Pricing Plan Features', () => {
  beforeEach(() => {
    fetch.mockResolvedValueOnce({
      json: async () => ({ country_code: 'IN' })
    })
  })

  it('should display all pricing plans', async () => {
    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('Beginner')).toBeInTheDocument()
      expect(screen.getByText('Intermediate')).toBeInTheDocument()
      expect(screen.getByText('Advanced')).toBeInTheDocument()
      expect(screen.getByText('One on One')).toBeInTheDocument()
    })
  })

  it('should display all plan features', async () => {
    render(<App />)

    await waitFor(() => {
      const features = screen.getAllByText(/Twice a week interactive sessions/)
      expect(features.length).toBeGreaterThan(0)
      
      expect(screen.getAllByText(/One tournament every month/).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/One masterclass per month/).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/Access to class resources/).length).toBeGreaterThan(0)
    })
  })
})
