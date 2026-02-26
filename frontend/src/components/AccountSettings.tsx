import React, { useState } from 'react';
import { Camera, Chrome, ChevronRight, Github, Loader2, Linkedin, Twitter, MessageCircle, RefreshCw } from 'lucide-react';
import { InputField, Button } from './SettingsHelpers';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

export default function AccountSettings({ isDarkMode }: { isDarkMode?: boolean }) {
  const [isConnectingGitHub, setIsConnectingGitHub] = useState(false);
  const [githubConnected, setGithubConnected] = useState(false);
  const [isConnectingLinkedIn, setIsConnectingLinkedIn] = useState(false);
  const [linkedinConnected, setLinkedinConnected] = useState(false);
  const [isConnectingTwitter, setIsConnectingTwitter] = useState(false);
  const [twitterConnected, setTwitterConnected] = useState(false);
  const [isConnectingDiscord, setIsConnectingDiscord] = useState(false);
  const [discordConnected, setDiscordConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Profile Update State
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    bio: '',
    location: '',
    website: '',
    github: '',
    linkedin: '',
    twitter: '',
    whatsapp: ''
  });

  // Fetch initial profile data
  React.useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userId = localStorage.getItem('userid');
        const token = localStorage.getItem('accessToken');
        if (!userId || !token || !API_BASE) return;

        const response = await fetch(`${API_BASE}/auth/profile/${userId}`, {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          // Split full name if needed
          const [firstName, ...lastNameParts] = (data.name || '').split(' ');
          
          setFormData({
            firstName: firstName || '',
            lastName: lastNameParts.join(' ') || '',
            email: data.email || '',
            bio: data.bio || '',
            location: data.location || '',
            website: data.website || '',
            github: data.github || '',
            linkedin: data.linkedin || '',
            twitter: data.twitter || '',
            whatsapp: data.whatsapp || ''
          });
        }
      } catch (error) {
        console.error('Failed to fetch profile', error);
      }
    };
    fetchProfile();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const userId = localStorage.getItem('userid');
      const token = localStorage.getItem('accessToken');
      
      if (!userId || !token || !API_BASE) {
        alert('Authentication error');
        return;
      }

      const payload = {
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        bio: formData.bio,
        location: formData.location,
        website: formData.website,
        // Add other fields as per API spec
      };

      const response = await fetch(`${API_BASE}/auth/profile/${userId}`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert('Profile updated successfully!');
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  React.useEffect(() => {
    // Check for success/error query params from backend redirect
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status');
    const platform = urlParams.get('platform');
    const message = urlParams.get('message');

    if (status === 'success' && platform) {
      const setStateMap: Record<string, (val: boolean) => void> = {
        'github': setGithubConnected,
        'linkedin': setLinkedinConnected,
        'twitter': setTwitterConnected,
        'discord': setDiscordConnected
      };
      
      if (setStateMap[platform.toLowerCase()]) {
        setStateMap[platform.toLowerCase()](true);
        alert(`${platform} connected successfully!`);
        // Clean up URL
        window.history.replaceState({}, '', window.location.pathname);
      }
    } else if (status === 'error') {
      alert(`Failed to connect ${platform || 'account'}: ${message || 'Unknown error'}`);
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  React.useEffect(() => {
    // Fetch connected social platforms on mount
    const fetchPlatforms = async () => {
      try {
        if (!API_BASE) return;
        const token = localStorage.getItem('accessToken');
        if (!token) return;

        const response = await fetch(`${API_BASE}/integrations/social/platforms`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          // Assuming response structure: { data: [{ provider: 'github', ... }, ...] } 
          // or similar array of connected providers
          const platforms = Array.isArray(data) ? data : (data.data || []);
          
          platforms.forEach((p: any) => {
            const provider = (p.provider || p.name || '').toLowerCase();
            if (provider === 'github') setGithubConnected(true);
            if (provider === 'linkedin') setLinkedinConnected(true);
            if (provider === 'twitter') setTwitterConnected(true);
            if (provider === 'discord') setDiscordConnected(true);
          });
        }
      } catch (error) {
        console.error('Failed to fetch connected platforms', error);
      }
    };

    fetchPlatforms();
  }, []);

  const handleSync = async () => {
    // Get list of connected platforms
    const platformsToSync: string[] = [];
    if (githubConnected) platformsToSync.push('github');
    if (linkedinConnected) platformsToSync.push('linkedin');
    if (twitterConnected) platformsToSync.push('twitter');
    if (discordConnected) platformsToSync.push('discord');

    if (platformsToSync.length === 0) {
      alert('No connected platforms to sync.');
      return;
    }

    setIsSyncing(true);
    try {
      if (!API_BASE) throw new Error('API URL is not defined');
      
      const token = localStorage.getItem('accessToken');
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${API_BASE}/integrations/social/sync`, {
        method: 'POST',
        headers: {
          'accept': '*/*',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ platforms: platformsToSync })
      });

      if (!response.ok) {
        throw new Error('Failed to sync data');
      }

      alert('Sync started successfully! Your profile data will be updated shortly.');
    } catch (error: any) {
      console.error('Sync error:', error);
      alert(error.message || 'Failed to sync data');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnect = async (platform: string) => {
    if (!confirm(`Are you sure you want to disconnect ${platform}?`)) return;

    // Map platform name to state setters
    const setStateMap: Record<string, (val: boolean) => void> = {
      'github': setGithubConnected,
      'linkedin': setLinkedinConnected,
      'twitter': setTwitterConnected,
      'discord': setDiscordConnected
    };

    try {
      if (!API_BASE) throw new Error('API URL is not defined');
      
      const token = localStorage.getItem('accessToken');
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${API_BASE}/integrations/social/platforms/${platform.toLowerCase()}`, {
        method: 'DELETE',
        headers: {
          'accept': '*/*',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Success - update state
        if (setStateMap[platform.toLowerCase()]) {
          setStateMap[platform.toLowerCase()](false);
        }
        alert(`${platform} disconnected successfully`);
      } else {
        // Handle errors based on status code
        if (response.status === 401) throw new Error('Unauthorized');
        if (response.status === 404) throw new Error('Platform not found');
        if (response.status === 500) throw new Error('Server error');
        throw new Error('Failed to disconnect');
      }
    } catch (error: any) {
      console.error(`Error disconnecting ${platform}:`, error);
      alert(error.message || `Failed to disconnect ${platform}`);
    }
  };

  const handleGitHubConnect = () => {
    if (!API_BASE) {
      alert('API URL is not defined');
      return;
    }
    // Redirect to backend to initiate OAuth flow
    // Assuming the backend endpoint is /integrations/social/{platform}/auth or similar
    // Based on the callback URL provided, we'll target the initiation route
    window.location.href = `${API_BASE}/integrations/social/github/auth`;
  };

  const handleLinkedInConnect = () => {
    if (!API_BASE) {
      alert('API URL is not defined');
      return;
    }
    window.location.href = `${API_BASE}/integrations/social/linkedin/auth`;
  };

  const handleTwitterConnect = () => {
    if (!API_BASE) {
      alert('API URL is not defined');
      return;
    }
    window.location.href = `${API_BASE}/integrations/social/twitter/auth`;
  };

  const handleDiscordConnect = () => {
    if (!API_BASE) {
      alert('API URL is not defined');
      return;
    }
    window.location.href = `${API_BASE}/integrations/social/discord/auth`;
  };

  return (
    <div className="space-y-6">
      <div className={`rounded-[24px] p-6 md:p-8 shadow-sm ${isDarkMode ? 'bg-[#111] border border-[#E70008]/20' : 'bg-white'}`}>
        <h2 className={`text-xl font-bold mb-6 ${isDarkMode ? 'text-[#F4A261]' : 'text-black'}`}>Profile Information</h2>
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="flex flex-col items-center gap-4 mx-auto md:mx-0">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#F4A261] to-[#E50914] flex items-center justify-center text-white font-bold text-3xl shadow-md relative">
              JD
              <div className={`absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm cursor-pointer transition-colors border ${isDarkMode ? 'bg-[#222] border-gray-700 hover:bg-[#333]' : 'bg-white border-gray-100 hover:bg-gray-50'}`}>
                <Camera size={14} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
              </div>
            </div>
            <button className="text-sm font-semibold text-[#E50914] hover:text-[#cc0812] transition-colors">
              Change Photo
            </button>
          </div>
          <div className="flex-1 w-full space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField label="First Name" name="firstName" defaultValue={formData.firstName} onChange={handleInputChange} isDarkMode={isDarkMode} />
              <InputField label="Last Name" name="lastName" defaultValue={formData.lastName} onChange={handleInputChange} isDarkMode={isDarkMode} />
            </div>
            <InputField label="Email Address" name="email" defaultValue={formData.email} type="email" isDarkMode={isDarkMode} />
            <div className="space-y-2">
              <label className={`text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Bio</label>
              <textarea 
                name="bio"
                rows={4}
                defaultValue={formData.bio}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 rounded-xl border focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] focus:outline-none transition-all text-sm resize-none ${
                  isDarkMode ? 'bg-[#222] border-gray-700 text-white' : 'bg-gray-50 border-gray-100 text-black'
                }`}
              ></textarea>
            </div>
            <InputField label="Location" name="location" defaultValue={formData.location} onChange={handleInputChange} isDarkMode={isDarkMode} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField label="Website (optional)" name="website" placeholder="https://yourwebsite.com" defaultValue={formData.website} onChange={handleInputChange} isDarkMode={isDarkMode} />
                <InputField label="GitHub (optional)" name="github" placeholder="https://github.com/username" defaultValue={formData.github} onChange={handleInputChange} isDarkMode={isDarkMode} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField label="LinkedIn (optional)" name="linkedin" placeholder="https://linkedin.com/in/username" defaultValue={formData.linkedin} onChange={handleInputChange} isDarkMode={isDarkMode} />
                <InputField label="Twitter (optional)" name="twitter" placeholder="https://twitter.com/username" defaultValue={formData.twitter} onChange={handleInputChange} isDarkMode={isDarkMode} />
            </div>
            <InputField label="WhatsApp (optional)" name="whatsapp" placeholder="+254..." defaultValue={formData.whatsapp} onChange={handleInputChange} isDarkMode={isDarkMode} />

            <div className="pt-4 flex justify-end">
              <Button primary onClick={handleSaveProfile} disabled={isSaving} isDarkMode={isDarkMode}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>

            <div className="space-y-2">
              <label className={`text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Your Availability</label>
              <div className="relative">
                <select className={`w-full px-4 py-3 rounded-xl border focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] focus:outline-none transition-all text-sm appearance-none cursor-pointer ${
                  isDarkMode ? 'bg-[#222] border-gray-700 text-[#F4A261]' : 'bg-gray-50 border-gray-100 text-black'
                }`}>
                  <option value="available">Available</option>
                  <option value="unavailable">Unavailable</option>
                  <option value="break">On Break</option>
                </select>
                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 rotate-90" size={16} />
              </div>
            </div>

            <div className="pt-4 flex gap-4">
              <Button primary isDarkMode={isDarkMode}>Save Changes</Button>
              <Button isDarkMode={isDarkMode}>Cancel</Button>
            </div>
          </div>
        </div>
      </div>

      <div className={`rounded-[24px] p-6 md:p-8 shadow-sm ${isDarkMode ? 'bg-[#111] border border-[#E70008]/20' : 'bg-white'}`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-lg font-bold ${isDarkMode ? 'text-[#F9E4AD]' : 'text-black'}`}>Connected Accounts</h2>
          <button 
            onClick={handleSync}
            disabled={isSyncing}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              isDarkMode 
                ? 'bg-[#222] text-gray-300 hover:text-white hover:bg-[#333] disabled:opacity-50' 
                : 'bg-gray-100 text-gray-600 hover:text-black hover:bg-gray-200 disabled:opacity-50'
            }`}
            title="Sync data from all connected platforms"
          >
            <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} />
            {isSyncing ? 'Syncing...' : 'Sync Data'}
          </button>
        </div>
        <div className="space-y-4">
          {/* Google */}
          <div className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
            isDarkMode ? 'border-gray-700 hover:border-gray-600' : 'border-gray-100 hover:border-gray-200'
          }`}>
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-[#222]' : 'bg-gray-50'}`}>
                <Chrome className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`} />
              </div>
              <div>
                <h3 className={`font-semibold text-sm ${isDarkMode ? 'text-white' : 'text-black'}`}>Google</h3>
                <p className="text-xs text-gray-500">john.doe@gmail.com</p>
              </div>
            </div>
            <button className={`px-4 py-2 rounded-full border text-xs font-semibold transition-all ${
              isDarkMode 
                ? 'border-gray-700 text-gray-400 hover:bg-[#222] hover:text-[#E50914] hover:border-[#E50914]/30' 
                : 'border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-[#E50914] hover:border-[#E50914]/30'
            }`}>
              Disconnect
            </button>
          </div>

          {/* GitHub */}
          <div className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
            isDarkMode ? 'border-gray-700 hover:border-gray-600' : 'border-gray-100 hover:border-gray-200'
          }`}>
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-[#222]' : 'bg-gray-50'}`}>
                <Linkedin className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`} />
              </div>
              <div>
                <h3 className={`font-semibold text-sm ${isDarkMode ? 'text-white' : 'text-black'}`}>LinkedIn</h3>
                <p className="text-xs text-gray-500">{linkedinConnected ? 'Connected' : 'Connect your LinkedIn account'}</p>
              </div>
            </div>
            <button 
              onClick={() => linkedinConnected ? handleDisconnect('linkedin') : handleLinkedInConnect()}
              disabled={isConnectingLinkedIn}
              className={`px-4 py-2 rounded-full border text-xs font-semibold transition-all flex items-center gap-2 ${
              linkedinConnected
                ? (isDarkMode ? 'border-green-500 text-green-500 bg-green-500/10 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500' : 'border-green-600 text-green-600 bg-green-50 hover:bg-red-50 hover:text-red-600 hover:border-red-600')
                : (isDarkMode 
                  ? 'bg-[#E50914] border-[#E50914] text-white hover:bg-[#cc0812]' 
                  : 'bg-black border-black text-white hover:bg-gray-800')
            }`}>
              {isConnectingLinkedIn ? <Loader2 size={14} className="animate-spin" /> : null}
              {linkedinConnected ? 'Disconnect' : (isConnectingLinkedIn ? 'Connecting...' : 'Connect')}
            </button>
          </div>
          {/* Twitter */}
          <div className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
            isDarkMode ? 'border-gray-700 hover:border-gray-600' : 'border-gray-100 hover:border-gray-200'
          }`}>
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-[#222]' : 'bg-gray-50'}`}>
                <Twitter className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`} />
              </div>
              <div>
                <h3 className={`font-semibold text-sm ${isDarkMode ? 'text-white' : 'text-black'}`}>Twitter</h3>
                <p className="text-xs text-gray-500">{twitterConnected ? 'Connected' : 'Connect your Twitter account'}</p>
              </div>
            </div>
            <button 
              onClick={() => twitterConnected ? handleDisconnect('twitter') : handleTwitterConnect()}
              disabled={isConnectingTwitter}
              className={`px-4 py-2 rounded-full border text-xs font-semibold transition-all flex items-center gap-2 ${
              twitterConnected
                ? (isDarkMode ? 'border-green-500 text-green-500 bg-green-500/10 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500' : 'border-green-600 text-green-600 bg-green-50 hover:bg-red-50 hover:text-red-600 hover:border-red-600')
                : (isDarkMode 
                  ? 'bg-[#E50914] border-[#E50914] text-white hover:bg-[#cc0812]' 
                  : 'bg-black border-black text-white hover:bg-gray-800')
            }`}>
              {isConnectingTwitter ? <Loader2 size={14} className="animate-spin" /> : null}
              {twitterConnected ? 'Disconnect' : (isConnectingTwitter ? 'Connecting...' : 'Connect')}
            </button>
          </div>
          {/* Discord */}
          <div className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
            isDarkMode ? 'border-gray-700 hover:border-gray-600' : 'border-gray-100 hover:border-gray-200'
          }`}>
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-[#222]' : 'bg-gray-50'}`}>
                <MessageCircle className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`} />
              </div>
              <div>
                <h3 className={`font-semibold text-sm ${isDarkMode ? 'text-white' : 'text-black'}`}>Discord</h3>
                <p className="text-xs text-gray-500">{discordConnected ? 'Connected' : 'Connect your Discord account'}</p>
              </div>
            </div>
            <button 
              onClick={() => discordConnected ? handleDisconnect('discord') : handleDiscordConnect()}
              disabled={isConnectingDiscord}
              className={`px-4 py-2 rounded-full border text-xs font-semibold transition-all flex items-center gap-2 ${
              discordConnected
                ? (isDarkMode ? 'border-green-500 text-green-500 bg-green-500/10 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500' : 'border-green-600 text-green-600 bg-green-50 hover:bg-red-50 hover:text-red-600 hover:border-red-600')
                : (isDarkMode 
                  ? 'bg-[#E50914] border-[#E50914] text-white hover:bg-[#cc0812]' 
                  : 'bg-black border-black text-white hover:bg-gray-800')
            }`}>
              {isConnectingDiscord ? <Loader2 size={14} className="animate-spin" /> : null}
              {discordConnected ? 'Disconnect' : (isConnectingDiscord ? 'Connecting...' : 'Connect')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
