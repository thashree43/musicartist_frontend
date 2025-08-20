/* eslint-disable no-unused-vars */
import React, { useState, useCallback } from 'react';
import { Search, User, ImageOff } from 'lucide-react';
import axios from "axios";

const ArtistSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [error, setError] = useState('');

  const API_BASE_URL = 'http://localhost:3000/api';

  // Search artists
  const searchArtists = async (query) => {
    if (!query.trim()) return { suggestions: [], results: [] };
    try {
      const response = await axios.get(`${API_BASE_URL}/search`, {
        params: {
          q: query,
          limit: 20
        }
      });
      
      console.log('Backend response:', response.data);
      
      // Ensure we have the expected structure
      return {
        suggestions: response.data.suggestions || [],
        results: response.data.results || []
      };
    } catch (error) {
      console.error('Error searching artists:', error);
      setError('Failed to search artists. Please try again.');
      return { suggestions: [], results: [] };
    }
  };

  // Get artist details
  const getArtistDetails = async (spotifyId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/artist/${spotifyId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting artist details:', error);
      setError('Failed to load artist details.');
      return null;
    }
  };

  // Helper function to get image URL with fallback
const getImageUrl = (artist) => {
  if (artist?.imageUrl) return artist.imageUrl;   // ✅ use main image
  if (artist?.images?.length > 0) return artist.images[0].url;
  return null;
};

  // Handle image loading errors
  const handleImageError = (e, artist, size = 'large') => {
    console.log('Image failed to load:', e.target.src);
    e.target.style.display = 'none';
  };

  // Debounced search
  const debouncedSearch = useCallback(
    debounce(async (query) => {
      if (query.length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }
      setIsLoading(true);
      setError('');
      const data = await searchArtists(query);
      setSuggestions(data.suggestions.slice(0, 8));
      setShowSuggestions(true);
      setIsLoading(false);
    }, 300),
    []
  );

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    debouncedSearch(value);
  };

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsLoading(true);
    setShowSuggestions(false);
    setError('');
    const data = await searchArtists(searchQuery);
    setSearchResults(data.results);
    setIsLoading(false);
  };

  const handleSuggestionClick = async (artist) => {
    setSearchQuery(artist.name);
    setShowSuggestions(false);
    setSelectedArtist(artist);
    setError('');
    const detailedArtist = await getArtistDetails(artist.spotifyId || artist.id);
    if (detailedArtist) {
      setSelectedArtist(detailedArtist);
    }
  };

  // Component for displaying artist image with fallback
  const ArtistImage = ({ artist, size = 'large', className = '' }) => {
    const imageUrl = getImageUrl(artist, size);
    const [imageError, setImageError] = useState(false);
    
    if (!imageUrl || imageError) {
      return (
        <div className={className} style={{
          width: size === 'small' ? '40px' : '100%',
          height: size === 'small' ? '40px' : '200px',
          borderRadius: size === 'small' ? '50%' : '10px',
          backgroundColor: '#f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#999'
        }}>
          {size === 'small' ? (
            <User size={20} />
          ) : (
            <ImageOff size={40} />
          )}
        </div>
      );
    }
    
    return (
      <img
        src={imageUrl}
        alt={artist.name}
        className={className}
        style={{
          width: size === 'small' ? '40px' : '100%',
          height: size === 'small' ? '40px' : '200px',
          borderRadius: size === 'small' ? '50%' : '10px',
          objectFit: 'cover'
        }}
        onError={() => setImageError(true)}
      />
    );
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 'bold',
          background: 'linear-gradient(135deg, #1db954, #1ed760)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '10px'
        }}>
          Music Artist Explorer
        </h1>
        <p style={{ color: '#666', fontSize: '1.1rem' }}>
          Discover and explore music artists from around the world
        </p>
      </div>

      {/* Search Section */}
      <div style={{ position: 'relative', marginBottom: '30px' }}>
        <form onSubmit={handleSearchSubmit} style={{ position: 'relative' }}>
          <div style={{ position: 'relative', maxWidth: '600px', margin: '0 auto' }}>
            <Search style={{
              position: 'absolute',
              left: '15px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#666',
              width: '20px',
              height: '20px'
            }} />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search for artists (e.g., Taylor Swift, The Beatles...)"
              style={{
                width: '100%',
                padding: '15px 50px',
                fontSize: '16px',
                border: '2px solid #e1e1e1',
                borderRadius: '50px',
                outline: 'none'
              }}
            />
            {isLoading && (
              <div style={{
                position: 'absolute',
                right: '15px',
                top: '50%',
                transform: 'translateY(-50%)'
              }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid #1db954',
                  borderTop: '2px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
              </div>
            )}
          </div>

          {/* Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '100%',
              maxWidth: '600px',
              backgroundColor: 'white',
              border: '1px solid #e1e1e1',
              borderRadius: '10px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              zIndex: 1000,
              marginTop: '5px'
            }}>
              {suggestions.map((artist, index) => (
                <div
                  key={artist.spotifyId || artist.id || index}
                  onClick={() => handleSuggestionClick(artist)}
                  style={{
                    padding: '12px 15px',
                    cursor: 'pointer',
                    borderBottom: index < suggestions.length - 1 ? '1px solid #f0f0f0' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  <ArtistImage artist={artist} size="small" />
                  <div>
                    <div style={{ fontWeight: '500', color: '#333' }}>{artist.name}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {artist.followers?.total?.toLocaleString?.() || artist.followers || 0} followers
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </form>
      </div>

      {/* Results Section */}
      <div>
        {searchResults.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>Search Results</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
              {searchResults.map((artist) => (
                <div key={artist.spotifyId || artist.id} style={{
                  border: '1px solid #e1e1e1',
                  borderRadius: '10px',
                  padding: '15px',
                  textAlign: 'center',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                }}>
                  <ArtistImage artist={artist} size="large" />
                  <h3 style={{ marginTop: '10px', fontSize: '1.1rem' }}>{artist.name}</h3>
                  <p style={{ fontSize: '0.9rem', color: '#666' }}>
                    {artist.followers?.total?.toLocaleString?.() || artist.followers || 0} followers
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

// Debounce util
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export default ArtistSearch;