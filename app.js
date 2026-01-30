// ============================================
// NEXUS APPLICATION - MAIN JAVASCRIPT (FIXED)
// ============================================

// Application State
const appState = {
    currentUser: null,
    currentProfile: null,
    currentPage: 'loading',
    posts: [],
    isLoading: false,
    tempSignupData: null,
    currentPostComments: {},
    expandedComments: {},
    likedPosts: new Set(),
    postMediaUrls: {},
    isCreatingPost: false,
    notifications: [],
    unreadNotifications: 0,
    friends: [],
    friendRequests: [],
    searchResults: [],
    searchDebounceTimer: null,
    currentFriendsTab: 'users'
};

// DOM Element References
let mainContent, bottomNav, notificationBadge, notificationCount;

// ============================================
// UTILITY FUNCTIONS
// ============================================

function showInlineMessage(message, type = 'info', duration = 2000) {
    const existingMessage = document.querySelector('.inline-message');
    if (existingMessage) existingMessage.remove();
    
    const messageEl = document.createElement('div');
    messageEl.className = `inline-message ${type}`;
    messageEl.textContent = message;
    messageEl.style.backgroundColor = type === 'error' ? '#f72585' : 
                                   type === 'success' ? '#31a24c' : '#4361ee';
    
    document.body.appendChild(messageEl);
    
    setTimeout(() => {
        messageEl.style.animation = 'slideOutMessage 0.3s ease forwards';
        setTimeout(() => messageEl.remove(), 300);
    }, duration);
}

function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
}

function formatTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
}

// ============================================
// PAGE RENDERING FUNCTIONS
// ============================================

function renderLoadingPage() {
    if (!mainContent) return;
    mainContent.innerHTML = `
        <div class="loading-screen">
            <div class="spinner"></div>
            <p>Loading Nexus...</p>
        </div>
    `;
}

function renderAuthPage() {
    if (!mainContent) return;
    
    document.body.classList.add('auth-page');
    document.querySelector('.app-header')?.classList.add('hidden');
    document.querySelector('.bottom-nav')?.classList.add('hidden');
    
    const today = new Date();
    const minDate = new Date(today.getFullYear() - 13, today.getMonth(), today.getDate());
    const maxDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());
    const defaultDob = new Date(today.getFullYear() - 20, today.getMonth(), today.getDate()).toISOString().split('T')[0];
    
    mainContent.innerHTML = `
        <div class="auth-container">
            <div class="auth-header">
                <h2>Welcome to Nexus</h2>
                <p>Connect with friends and the world around you</p>
            </div>
            
            <div class="auth-tabs">
                <div class="auth-tab active" onclick="switchAuthTab('login')">Login</div>
                <div class="auth-tab" onclick="switchAuthTab('signup')">Sign Up</div>
            </div>
            
            <form id="loginForm" class="auth-form active" onsubmit="handleLogin(event)">
                <div class="form-group">
                    <label for="loginEmail">Email</label>
                    <input type="email" id="loginEmail" class="form-control" placeholder="Enter your email" required>
                </div>
                
                <div class="form-group">
                    <label for="loginPassword">Password</label>
                    <input type="password" id="loginPassword" class="form-control" placeholder="Enter your password" required>
                </div>
                
                <button type="submit" class="btn btn-primary" id="loginBtn">
                    <span class="btn-text">Login to Nexus</span>
                    <div class="spinner-small"></div>
                </button>
                
                <div class="auth-footer">
                    <p>Don't have an account? <a href="#" onclick="switchAuthTab('signup')">Sign up here</a></p>
                </div>
            </form>
            
            <form id="signupForm" class="auth-form" onsubmit="handleSignup(event)">
                <div class="form-row">
                    <div class="form-group">
                        <label for="firstName">First Name</label>
                        <input type="text" id="firstName" class="form-control" placeholder="John" required>
                    </div>
                    <div class="form-group">
                        <label for="lastName">Last Name</label>
                        <input type="text" id="lastName" class="form-control" placeholder="Doe" required>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="dob">Date of Birth</label>
                    <input type="date" id="dob" class="form-control" required
                           max="${minDate.toISOString().split('T')[0]}"
                           min="${maxDate.toISOString().split('T')[0]}"
                           value="${defaultDob}">
                </div>
                
                <div class="form-group">
                    <label for="phone">Phone Number (Optional)</label>
                    <input type="tel" id="phone" class="form-control" placeholder="+1 234 567 8900">
                </div>
                
                <div class="form-group">
                    <label for="signupEmail">Email</label>
                    <input type="email" id="signupEmail" class="form-control" placeholder="john@example.com" required>
                </div>
                
                <div class="form-group">
                    <label for="signupPassword">Password</label>
                    <input type="password" id="signupPassword" class="form-control" placeholder="Create a strong password" required>
                </div>
                
                <div class="form-group">
                    <label for="confirmPassword">Confirm Password</label>
                    <input type="password" id="confirmPassword" class="form-control" placeholder="Confirm your password" required>
                </div>
                
                <button type="submit" class="btn btn-primary" id="signupBtn">
                    <span class="btn-text">Create Account</span>
                    <div class="spinner-small"></div>
                </button>
                
                <div class="auth-footer">
                    <p>Already have an account? <a href="#" onclick="switchAuthTab('login')">Login here</a></p>
                </div>
            </form>
        </div>
    `;
}

function renderVerificationPage() {
    if (!mainContent) return;
    
    document.body.classList.add('auth-page');
    document.querySelector('.app-header')?.classList.add('hidden');
    document.querySelector('.bottom-nav')?.classList.add('hidden');
    
    mainContent.innerHTML = `
        <div class="verification-container">
            <div class="verification-icon">
                <i class="fas fa-envelope-open-text"></i>
            </div>
            
            <h2>Verify Your Email</h2>
            <p>We've sent a 6-digit verification code to your email address. Please enter the code below to continue.</p>
            
            <form onsubmit="handleVerification(event)">
                <div class="code-inputs">
                    <input type="text" maxlength="1" class="code-input" data-index="0" oninput="moveToNextInput(this)">
                    <input type="text" maxlength="1" class="code-input" data-index="1" oninput="moveToNextInput(this)">
                    <input type="text" maxlength="1" class="code-input" data-index="2" oninput="moveToNextInput(this)">
                    <input type="text" maxlength="1" class="code-input" data-index="3" oninput="moveToNextInput(this)">
                    <input type="text" maxlength="1" class="code-input" data-index="4" oninput="moveToNextInput(this)">
                    <input type="text" maxlength="1" class="code-input" data-index="5" oninput="moveToNextInput(this)">
                </div>
                
                <button type="submit" class="btn btn-primary" id="verifyBtn">
                    <span class="btn-text">Verify Email</span>
                    <div class="spinner-small"></div>
                </button>
                
                <div style="margin-top: 20px;">
                    <p style="font-size: 14px; color: #777;">Didn't receive the code? <a href="#" onclick="resendVerificationCode()" style="color: #4361ee; font-weight: 500;">Resend Code</a></p>
                </div>
            </form>
        </div>
    `;
    
    setTimeout(() => document.querySelector('.code-input')?.focus(), 100);
}

function renderFeedPage() {
    if (!mainContent) return;
    
    document.body.classList.remove('auth-page');
    document.querySelector('.app-header')?.classList.remove('hidden');
    document.querySelector('.bottom-nav')?.classList.remove('hidden');
    
    const placeholder = appState.currentProfile ? 
        `What's on your mind, ${truncateText(appState.currentProfile.first_name, 12)}?` : 
        "What's on your mind?";
    
    mainContent.innerHTML = `
        <div class="feed-container">
            <div class="create-post-card">
                <div class="post-input-container">
                    <img src="${appState.currentProfile?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}" 
                         alt="Your avatar" class="user-avatar">
                    <div class="post-input-wrapper">
                        <input type="text" class="post-input" id="postContentInput" 
                               placeholder="${placeholder}" 
                               onclick="openCreatePostModal()" readonly>
                    </div>
                </div>
                
                <div class="post-actions">
                    <div class="post-action-btn" onclick="openImageUploadModal()">
                        <i class="fas fa-image"></i>
                        <span>Photo/Video</span>
                    </div>
                </div>
            </div>
            
            <div class="posts-container" id="postsContainer">
                <div class="loading-screen">
                    <div class="spinner"></div>
                    <p>Loading posts...</p>
                </div>
            </div>
        </div>
    `;
    
    setTimeout(loadPosts, 100);
    loadNotifications();
}

function renderProfilePage() {
    if (!mainContent || !appState.currentProfile) return;
    
    document.body.classList.remove('auth-page');
    document.querySelector('.app-header')?.classList.remove('hidden');
    document.querySelector('.bottom-nav')?.classList.remove('hidden');
    
    const profile = appState.currentProfile;
    
    mainContent.innerHTML = `
        <div class="profile-container">
            <div class="profile-header">
                <div class="profile-cover"></div>
                
                <div class="profile-info">
                    <img src="${profile.avatar_url}" 
                         alt="${profile.first_name} ${profile.last_name}" 
                         class="profile-avatar">
                    
                    <div class="profile-details">
                        <h1 class="profile-name">${profile.first_name} ${profile.last_name}</h1>
                        ${profile.username ? `<p class="profile-username">@${profile.username}</p>` : ''}
                        <p class="profile-bio">${profile.bio || 'Welcome to my Nexus profile!'}</p>
                        
                        <div class="profile-stats">
                            <div class="stat-item">
                                <div class="stat-value" id="postCount">0</div>
                                <div class="stat-label">Posts</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-value" id="friendCount">0</div>
                                <div class="stat-label">Friends</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-value" id="likeCount">0</div>
                                <div class="stat-label">Likes</div>
                            </div>
                        </div>
                        
                        <div class="profile-actions">
                            <button class="btn btn-primary" onclick="openEditProfileModal()">
                                <i class="fas fa-edit"></i> Edit Profile
                            </button>
                            <button class="btn btn-secondary" onclick="openFriendsModal()">
                                <i class="fas fa-users"></i> Friends
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="profile-content">
                <div id="profilePostsContainer">
                    <div class="loading-screen">
                        <div class="spinner"></div>
                        <p>Loading your posts...</p>
                    </div>
                </div>
                
                <div class="profile-sidebar">
                    <div class="profile-card">
                        <h3><i class="fas fa-user-circle"></i> About</h3>
                        <div class="info-item">
                            <i class="fas fa-envelope"></i>
                            <div class="info-content">
                                <h4>Email</h4>
                                <p>${appState.currentUser?.email || 'Not available'}</p>
                            </div>
                        </div>
                        <div class="info-item">
                            <i class="fas fa-birthday-cake"></i>
                            <div class="info-content">
                                <h4>Date of Birth</h4>
                                <p>${new Date(profile.date_of_birth).toLocaleDateString()}</p>
                            </div>
                        </div>
                        ${profile.phone ? `
                        <div class="info-item">
                            <i class="fas fa-phone"></i>
                            <div class="info-content">
                                <h4>Phone</h4>
                                <p>${profile.phone}</p>
                            </div>
                        </div>
                        ` : ''}
                        <div class="info-item">
                            <i class="fas fa-calendar-alt"></i>
                            <div class="info-content">
                                <h4>Member Since</h4>
                                <p>${new Date(profile.created_at).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div class="profile-actions" style="margin-top: 20px;">
                            <button class="btn btn-secondary" onclick="handleLogout()" style="width: 100%;">
                                <i class="fas fa-sign-out-alt"></i> Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    setTimeout(() => {
        loadUserPosts();
        loadFriendCount();
    }, 100);
}

function renderSearchPage() {
    if (!mainContent) return;
    
    document.body.classList.remove('auth-page');
    document.querySelector('.app-header')?.classList.remove('hidden');
    document.querySelector('.bottom-nav')?.classList.remove('hidden');
    
    mainContent.innerHTML = `
        <div class="search-container">
            <div class="search-header">
                <h2><i class="fas fa-search"></i> Search Friends</h2>
                <p>Find and connect with people on Nexus</p>
            </div>
            
            <div class="search-input-container">
                <div class="search-input-wrapper">
                    <i class="fas fa-search"></i>
                    <input type="text" 
                           id="searchInput" 
                           class="search-input" 
                           placeholder="Search by name or username..."
                           oninput="handleSearchInput()"
                           autocomplete="off">
                    <button class="clear-search" id="clearSearchBtn" onclick="clearSearch()" style="display: none;">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            
            <div class="search-tabs">
                <div class="search-tab ${appState.currentFriendsTab === 'users' ? 'active' : ''}" onclick="switchSearchTab('users')">
                    <i class="fas fa-users"></i> Users
                </div>
                <div class="search-tab ${appState.currentFriendsTab === 'friends' ? 'active' : ''}" onclick="switchSearchTab('friends')">
                    <i class="fas fa-user-friends"></i> My Friends
                </div>
                <div class="search-tab ${appState.currentFriendsTab === 'requests' ? 'active' : ''}" onclick="switchSearchTab('requests')">
                    <i class="fas fa-user-plus"></i> Friend Requests
                    ${appState.friendRequests.length > 0 ? `<span class="tab-badge">${appState.friendRequests.length}</span>` : ''}
                </div>
            </div>
            
            <div class="search-results" id="searchResults">
                ${appState.currentFriendsTab === 'users' ? `
                    <div class="search-placeholder">
                        <i class="fas fa-search fa-3x"></i>
                        <h3>Start Searching</h3>
                        <p>Enter a name or username to find friends</p>
                    </div>
                ` : appState.currentFriendsTab === 'friends' ? `
                    <div class="loading-screen">
                        <div class="spinner"></div>
                        <p>Loading friends...</p>
                    </div>
                ` : `
                    <div class="loading-screen">
                        <div class="spinner"></div>
                        <p>Loading friend requests...</p>
                    </div>
                `}
            </div>
        </div>
    `;
    
    // Load appropriate content based on current tab
    if (appState.currentFriendsTab === 'friends') {
        setTimeout(loadFriendsForSearch, 100);
    } else if (appState.currentFriendsTab === 'requests') {
        setTimeout(loadFriendRequests, 100);
    }
}

function renderNotificationsPage() {
    if (!mainContent) return;
    
    document.body.classList.remove('auth-page');
    document.querySelector('.app-header')?.classList.remove('hidden');
    document.querySelector('.bottom-nav')?.classList.remove('hidden');
    
    mainContent.innerHTML = `
        <div class="notifications-container">
            <div class="notifications-header">
                <h2><i class="fas fa-bell"></i> Notifications</h2>
                <div class="notifications-header-actions">
                    <button class="btn btn-secondary btn-sm" onclick="markAllNotificationsAsRead()">
                        <i class="fas fa-check-double"></i> Mark All Read
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="refreshNotifications()">
                        <i class="fas fa-sync-alt"></i> Refresh
                    </button>
                </div>
            </div>
            
            <div class="notifications-tabs">
                <div class="notifications-tab active" onclick="switchNotificationsTab('all')">
                    All
                </div>
                <div class="notifications-tab" onclick="switchNotificationsTab('unread')">
                    Unread ${appState.unreadNotifications > 0 ? `<span class="tab-badge">${appState.unreadNotifications}</span>` : ''}
                </div>
                <div class="notifications-tab" onclick="switchNotificationsTab('friend_requests')">
                    Friend Requests
                </div>
            </div>
            
            <div class="notifications-list" id="notificationsList">
                <div class="loading-screen">
                    <div class="spinner"></div>
                    <p>Loading notifications...</p>
                </div>
            </div>
        </div>
    `;
    
    setTimeout(loadNotificationsList, 100);
}

// ============================================
// PAGE NAVIGATION
// ============================================

function navigateTo(page) {
    appState.currentPage = page;
    updateBottomNav();
    
    switch(page) {
        case 'loading': renderLoadingPage(); break;
        case 'auth': renderAuthPage(); break;
        case 'verification': renderVerificationPage(); break;
        case 'feed': renderFeedPage(); break;
        case 'profile': renderProfilePage(); break;
        case 'search': 
            appState.currentFriendsTab = 'users';
            renderSearchPage(); 
            break;
        case 'notifications': renderNotificationsPage(); break;
        default: renderFeedPage();
    }
}

function updateBottomNav() {
    if (!bottomNav) return;
    
    bottomNav.innerHTML = `
        <div class="nav-item ${appState.currentPage === 'feed' ? 'active' : ''}" onclick="navigateTo('feed')">
            <i class="fas fa-home"></i>
            <span>Home</span>
        </div>
        <div class="nav-item ${appState.currentPage === 'search' ? 'active' : ''}" onclick="navigateTo('search')">
            <i class="fas fa-search"></i>
            <span>Search</span>
        </div>
        <div class="nav-item create-post" onclick="openCreatePostModal()">
            <i class="fas fa-plus"></i>
        </div>
        <div class="nav-item ${appState.currentPage === 'notifications' ? 'active' : ''}" onclick="navigateTo('notifications')">
            <i class="fas fa-bell"></i>
            <span>Alerts</span>
            ${appState.unreadNotifications > 0 ? `<span class="nav-badge">${appState.unreadNotifications}</span>` : ''}
        </div>
        <div class="nav-item ${appState.currentPage === 'profile' ? 'active' : ''}" onclick="navigateTo('profile')">
            <i class="fas fa-user"></i>
            <span>Profile</span>
        </div>
    `;
}

// ============================================
// AUTHENTICATION FUNCTIONS
// ============================================

function switchAuthTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(el => {
        el.classList.toggle('active', el.textContent.toLowerCase().includes(tab));
    });
    
    document.querySelectorAll('.auth-form').forEach(el => {
        el.classList.toggle('active', el.id === `${tab}Form`);
    });
}

async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const loginBtn = document.getElementById('loginBtn');
    
    loginBtn.classList.add('btn-loading');
    loginBtn.disabled = true;
    
    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        
        showInlineMessage('Welcome back!', 'success');
        
        const { data: profile, error: profileError } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();
        
        if (profileError || !profile) {
            console.warn('Profile not found, creating default profile...');
            
            const { data: newProfile, error: createError } = await supabaseClient
                .from('profiles')
                .insert({
                    id: data.user.id,
                    first_name: data.user.user_metadata?.first_name || 'User',
                    last_name: data.user.user_metadata?.last_name || 'Name',
                    date_of_birth: new Date().toISOString().split('T')[0]
                })
                .select()
                .single();
            
            if (createError) {
                console.error('Create profile error:', createError);
                // Fallback to basic profile
                appState.currentProfile = {
                    id: data.user.id,
                    first_name: data.user.user_metadata?.first_name || 'User',
                    last_name: data.user.user_metadata?.last_name || 'Name',
                    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
                    bio: 'Welcome to my Nexus profile!'
                };
            } else {
                appState.currentProfile = newProfile;
            }
        } else {
            appState.currentProfile = profile;
        }
        
        appState.currentUser = data.user;
        navigateTo('feed');
        
    } catch (error) {
        console.error('Login error:', error);
        showInlineMessage(error.message, 'error');
    } finally {
        loginBtn.classList.remove('btn-loading');
        loginBtn.disabled = false;
    }
}

async function handleSignup(event) {
    event.preventDefault();
    
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const signupBtn = document.getElementById('signupBtn');
    
    if (password !== confirmPassword) {
        showInlineMessage('Passwords do not match!', 'error');
        return;
    }
    
    if (password.length < 6) {
        showInlineMessage('Password must be at least 6 characters long', 'error');
        return;
    }
    
    const formData = {
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        dob: document.getElementById('dob').value,
        phone: document.getElementById('phone').value,
        email: document.getElementById('signupEmail').value,
        password: password
    };
    
    signupBtn.classList.add('btn-loading');
    signupBtn.disabled = true;
    
    try {
        appState.tempSignupData = formData;
        
        const { data, error } = await supabaseClient.auth.signUp({
            email: formData.email,
            password: formData.password,
            options: {
                data: {
                    first_name: formData.firstName,
                    last_name: formData.lastName
                },
                emailRedirectTo: `${window.location.origin}`
            }
        });
        
        if (error) throw error;
        
        showInlineMessage('Verification code sent!', 'success');
        navigateTo('verification');
        
    } catch (error) {
        console.error('Signup error:', error);
        showInlineMessage(error.message, 'error');
    } finally {
        signupBtn.classList.remove('btn-loading');
        signupBtn.disabled = false;
    }
}

function moveToNextInput(input) {
    const index = parseInt(input.dataset.index);
    const value = input.value;
    
    input.classList.toggle('filled', value !== '');
    
    if (value && index < 5) {
        const nextInput = document.querySelector(`.code-input[data-index="${index + 1}"]`);
        if (nextInput) nextInput.focus();
    }
    
    if (index === 5 && value) {
        const allFilled = Array.from(document.querySelectorAll('.code-input'))
            .every(input => input.value);
        
        if (allFilled) {
            setTimeout(() => handleVerification(new Event('submit')), 300);
        }
    }
}

async function handleVerification(event) {
    event.preventDefault();
    
    const verifyBtn = document.getElementById('verifyBtn');
    const codeInputs = document.querySelectorAll('.code-input');
    const token = Array.from(codeInputs).map(input => input.value).join('');
    
    if (token.length !== 6) {
        showInlineMessage('Please enter the complete 6-digit code', 'error');
        return;
    }
    
    verifyBtn.classList.add('btn-loading');
    verifyBtn.disabled = true;
    
    try {
        const { data, error } = await supabaseClient.auth.verifyOtp({
            email: appState.tempSignupData.email,
            token: token,
            type: 'signup'
        });
        
        if (error) throw error;
        
        // Get or create profile
        const { data: profile, error: profileError } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();
        
        if (profileError || !profile) {
            const { data: newProfile, error: createError } = await supabaseClient
                .from('profiles')
                .insert({
                    id: data.user.id,
                    first_name: appState.tempSignupData.firstName,
                    last_name: appState.tempSignupData.lastName,
                    date_of_birth: appState.tempSignupData.dob,
                    phone: appState.tempSignupData.phone || null
                })
                .select()
                .single();
            
            if (createError) {
                console.error('Create profile error:', createError);
                appState.currentProfile = {
                    id: data.user.id,
                    first_name: appState.tempSignupData.firstName,
                    last_name: appState.tempSignupData.lastName,
                    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
                    bio: 'Welcome to my Nexus profile!'
                };
            } else {
                appState.currentProfile = newProfile;
            }
        } else {
            appState.currentProfile = profile;
        }
        
        appState.tempSignupData = null;
        appState.currentUser = data.user;
        
        showInlineMessage('Welcome to Nexus!', 'success');
        setTimeout(() => navigateTo('feed'), 1000);
        
    } catch (error) {
        console.error('Verification error:', error);
        showInlineMessage(error.message, 'error');
    } finally {
        verifyBtn.classList.remove('btn-loading');
        verifyBtn.disabled = false;
    }
}

async function resendVerificationCode() {
    try {
        const { error } = await supabaseClient.auth.resend({
            type: 'signup',
            email: appState.tempSignupData.email
        });
        
        if (error) throw error;
        
        showInlineMessage('Verification code resent!', 'success');
    } catch (error) {
        console.error('Resend error:', error);
        showInlineMessage(error.message, 'error');
    }
}

async function handleLogout() {
    try {
        await supabaseClient.auth.signOut();
        appState.currentUser = null;
        appState.currentProfile = null;
        appState.notifications = [];
        appState.unreadNotifications = 0;
        appState.friendRequests = [];
        appState.friends = [];
        appState.searchResults = [];
        showInlineMessage('Logged out successfully', 'success');
        setTimeout(() => navigateTo('auth'), 1000);
    } catch (error) {
        console.error('Logout error:', error);
        showInlineMessage(error.message, 'error');
    }
}

// ============================================
// SEARCH FUNCTIONALITY (FIXED)
// ============================================

function handleSearchInput() {
    const searchInput = document.getElementById('searchInput');
    const clearBtn = document.getElementById('clearSearchBtn');
    const searchTerm = searchInput.value.trim();
    
    if (searchTerm.length === 0) {
        clearBtn.style.display = 'none';
        if (appState.currentFriendsTab === 'users') {
            showSearchPlaceholder();
        }
        return;
    }
    
    clearBtn.style.display = 'flex';
    
    clearTimeout(appState.searchDebounceTimer);
    appState.searchDebounceTimer = setTimeout(() => {
        if (searchTerm.length >= 2) {
            searchUsers(searchTerm);
        }
    }, 300);
}

async function searchUsers(searchTerm) {
    try {
        // Use case-insensitive search
        const { data, error } = await supabaseClient
            .from('profiles')
            .select('*')
            .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,username.ilike.%${searchTerm}%`)
            .neq('id', appState.currentUser.id)
            .limit(20);
        
        if (error) throw error;
        
        appState.searchResults = data || [];
        renderSearchResults();
        
    } catch (error) {
        console.error('Search error:', error);
        showInlineMessage('Failed to search users', 'error');
    }
}

function renderSearchResults() {
    const searchResults = document.getElementById('searchResults');
    if (!searchResults) return;
    
    if (appState.searchResults.length === 0) {
        searchResults.innerHTML = `
            <div class="search-placeholder">
                <i class="fas fa-user-slash fa-3x"></i>
                <h3>No users found</h3>
                <p>Try a different search term</p>
            </div>
        `;
        return;
    }
    
    // Check friendship status for each user
    searchResults.innerHTML = appState.searchResults.map(user => {
        // Check if already friends or request pending
        const isFriend = appState.friends.some(f => f.id === user.id);
        const hasPendingRequest = appState.friendRequests.some(r => r.user_id === user.id);
        
        return `
            <div class="search-result-item" data-user-id="${user.id}">
                <img src="${user.avatar_url}" alt="${user.first_name}" class="search-result-avatar">
                <div class="search-result-info">
                    <h4>${user.first_name} ${user.last_name}</h4>
                    ${user.username ? `<p class="search-result-username">@${user.username}</p>` : ''}
                    ${user.bio ? `<p class="search-result-bio">${truncateText(user.bio, 80)}</p>` : ''}
                </div>
                ${isFriend ? `
                    <button class="btn btn-secondary btn-sm" disabled>
                        <i class="fas fa-user-check"></i> Friends
                    </button>
                ` : hasPendingRequest ? `
                    <button class="btn btn-secondary btn-sm" disabled>
                        <i class="fas fa-clock"></i> Request Sent
                    </button>
                ` : `
                    <button class="btn btn-primary btn-sm" onclick="sendFriendRequest('${user.id}')">
                        <i class="fas fa-user-plus"></i> Add Friend
                    </button>
                `}
            </div>
        `;
    }).join('');
}

function showSearchPlaceholder() {
    const searchResults = document.getElementById('searchResults');
    if (!searchResults) return;
    
    searchResults.innerHTML = `
        <div class="search-placeholder">
            <i class="fas fa-search fa-3x"></i>
            <h3>Start Searching</h3>
            <p>Enter a name or username to find friends</p>
        </div>
    `;
}

function clearSearch() {
    const searchInput = document.getElementById('searchInput');
    const clearBtn = document.getElementById('clearSearchBtn');
    
    searchInput.value = '';
    clearBtn.style.display = 'none';
    appState.searchResults = [];
    showSearchPlaceholder();
}

function switchSearchTab(tab) {
    appState.currentFriendsTab = tab;
    
    // Update UI
    document.querySelectorAll('.search-tab').forEach(el => {
        el.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Load appropriate content
    if (tab === 'users') {
        if (document.getElementById('searchInput')?.value.trim()) {
            searchUsers(document.getElementById('searchInput').value.trim());
        } else {
            showSearchPlaceholder();
        }
    } else if (tab === 'friends') {
        loadFriendsForSearch();
    } else if (tab === 'requests') {
        loadFriendRequests();
    }
}

// ============================================
// FRIENDS FUNCTIONALITY (FIXED)
// ============================================

async function sendFriendRequest(friendId) {
    try {
        // Check if already friends
        const { data: existingFriendship } = await supabaseClient
            .from('friendships')
            .select('*')
            .or(`user_id.eq.${appState.currentUser.id}.and.friend_id.eq.${friendId},user_id.eq.${friendId}.and.friend_id.eq.${appState.currentUser.id}`)
            .single();
        
        if (existingFriendship) {
            if (existingFriendship.status === 'accepted') {
                showInlineMessage('You are already friends', 'info');
            } else if (existingFriendship.status === 'pending') {
                showInlineMessage('Friend request already pending', 'info');
            }
            return;
        }
        
        // Send friend request
        const { error } = await supabaseClient
            .from('friendships')
            .insert({
                user_id: appState.currentUser.id,
                friend_id: friendId,
                status: 'pending'
            });
        
        if (error) throw error;
        
        // Update button state
        const button = document.querySelector(`[data-user-id="${friendId}"] button`);
        if (button) {
            button.innerHTML = '<i class="fas fa-clock"></i> Request Sent';
            button.classList.remove('btn-primary');
            button.classList.add('btn-secondary');
            button.disabled = true;
        }
        
        // Send notification
        try {
            await supabaseClient.rpc('create_notification', {
                user_id: friendId,
                type: 'friend_request',
                message: `${appState.currentProfile.first_name} sent you a friend request`,
                sender_id: appState.currentUser.id
            });
        } catch (notifError) {
            console.warn('Notification error:', notifError);
        }
        
        showInlineMessage('Friend request sent!', 'success');
        loadNotifications();
        
    } catch (error) {
        console.error('Friend request error:', error);
        showInlineMessage('Failed to send friend request', 'error');
    }
}

async function loadFriendRequests() {
    try {
        const { data, error } = await supabaseClient
            .from('friendships')
            .select(`
                *,
                profiles!friendships_user_id_fkey(*)
            `)
            .eq('friend_id', appState.currentUser.id)
            .eq('status', 'pending');
        
        if (error) throw error;
        
        appState.friendRequests = data || [];
        renderFriendRequests();
        
    } catch (error) {
        console.error('Error loading friend requests:', error);
        showInlineMessage('Failed to load friend requests', 'error');
    }
}

function renderFriendRequests() {
    const results = document.getElementById('searchResults');
    if (!results) return;
    
    if (appState.friendRequests.length === 0) {
        results.innerHTML = `
            <div class="search-placeholder">
                <i class="fas fa-inbox fa-3x"></i>
                <h3>No pending requests</h3>
                <p>When someone sends you a friend request, it will appear here</p>
            </div>
        `;
        return;
    }
    
    results.innerHTML = appState.friendRequests.map(request => `
        <div class="search-result-item" data-request-id="${request.id}">
            <img src="${request.profiles.avatar_url}" alt="${request.profiles.first_name}" class="search-result-avatar">
            <div class="search-result-info">
                <h4>${request.profiles.first_name} ${request.profiles.last_name}</h4>
                ${request.profiles.username ? `<p class="search-result-username">@${request.profiles.username}</p>` : ''}
                <p class="search-result-time">${formatTime(request.created_at)}</p>
            </div>
            <div class="friend-request-actions">
                <button class="btn btn-primary btn-sm" onclick="acceptFriendRequest('${request.id}', '${request.profiles.id}')">
                    <i class="fas fa-check"></i> Accept
                </button>
                <button class="btn btn-secondary btn-sm" onclick="rejectFriendRequest('${request.id}')">
                    <i class="fas fa-times"></i> Reject
                </button>
            </div>
        </div>
    `).join('');
}

async function acceptFriendRequest(requestId, friendId) {
    try {
        const { error } = await supabaseClient
            .from('friendships')
            .update({ 
                status: 'accepted', 
                updated_at: new Date().toISOString() 
            })
            .eq('id', requestId);
        
        if (error) throw error;
        
        // Send notification
        try {
            await supabaseClient.rpc('create_notification', {
                user_id: friendId,
                type: 'friend_accept',
                message: `${appState.currentProfile.first_name} accepted your friend request`,
                sender_id: appState.currentUser.id
            });
        } catch (notifError) {
            console.warn('Notification error:', notifError);
        }
        
        showInlineMessage('Friend request accepted!', 'success');
        
        // Update UI
        loadFriendRequests();
        loadFriendCount();
        loadNotifications();
        
        // If on search page, refresh friends list
        if (appState.currentPage === 'search' && appState.currentFriendsTab === 'friends') {
            loadFriendsForSearch();
        }
        
    } catch (error) {
        console.error('Error accepting friend request:', error);
        showInlineMessage('Failed to accept friend request', 'error');
    }
}

async function rejectFriendRequest(requestId) {
    try {
        const { error } = await supabaseClient
            .from('friendships')
            .update({ 
                status: 'rejected', 
                updated_at: new Date().toISOString() 
            })
            .eq('id', requestId);
        
        if (error) throw error;
        
        showInlineMessage('Friend request rejected', 'success');
        loadFriendRequests();
        
    } catch (error) {
        console.error('Error rejecting friend request:', error);
        showInlineMessage('Failed to reject friend request', 'error');
    }
}

async function loadFriendCount() {
    try {
        const { data, error } = await supabaseClient
            .from('friendships')
            .select('*', { count: 'exact', head: true })
            .or(`user_id.eq.${appState.currentUser.id},friend_id.eq.${appState.currentUser.id}`)
            .eq('status', 'accepted');
        
        if (error) throw error;
        
        const friendCount = document.getElementById('friendCount');
        if (friendCount) friendCount.textContent = data || 0;
        
    } catch (error) {
        console.error('Error loading friend count:', error);
    }
}

async function loadFriendsForSearch() {
    try {
        const { data, error } = await supabaseClient
            .from('friendships')
            .select(`
                *,
                friend:friend_id(*),
                user:user_id(*)
            `)
            .or(`user_id.eq.${appState.currentUser.id},friend_id.eq.${appState.currentUser.id}`)
            .eq('status', 'accepted');
        
        if (error) throw error;
        
        const searchResults = document.getElementById('searchResults');
        if (!searchResults) return;
        
        if (!data || data.length === 0) {
            searchResults.innerHTML = `
                <div class="search-placeholder">
                    <i class="fas fa-user-friends fa-3x"></i>
                    <h3>No Friends Yet</h3>
                    <p>Start connecting with people!</p>
                </div>
            `;
            return;
        }
        
        const friends = data.map(friendship => {
            return friendship.user_id === appState.currentUser.id ? 
                friendship.friend : friendship.user;
        });
        
        searchResults.innerHTML = friends.map(friend => `
            <div class="search-result-item" data-friend-id="${friend.id}">
                <img src="${friend.avatar_url}" alt="${friend.first_name}" class="search-result-avatar">
                <div class="search-result-info">
                    <h4>${friend.first_name} ${friend.last_name}</h4>
                    ${friend.username ? `<p class="search-result-username">@${friend.username}</p>` : ''}
                    ${friend.bio ? `<p class="search-result-bio">${truncateText(friend.bio || 'Nexus user', 60)}</p>` : ''}
                </div>
                <button class="btn btn-secondary btn-sm" onclick="removeFriend('${friend.id}')">
                    <i class="fas fa-user-minus"></i> Remove
                </button>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading friends:', error);
        showInlineMessage('Failed to load friends', 'error');
    }
}

async function removeFriend(friendId) {
    if (!confirm('Remove this friend?')) return;
    
    try {
        const { error } = await supabaseClient
            .from('friendships')
            .delete()
            .or(`user_id.eq.${appState.currentUser.id}.and.friend_id.eq.${friendId},user_id.eq.${friendId}.and.friend_id.eq.${appState.currentUser.id}`);
        
        if (error) throw error;
        
        showInlineMessage('Friend removed', 'success');
        
        // Refresh UI
        if (appState.currentPage === 'search' && appState.currentFriendsTab === 'friends') {
            loadFriendsForSearch();
        }
        loadFriendCount();
        
    } catch (error) {
        console.error('Error removing friend:', error);
        showInlineMessage('Failed to remove friend', 'error');
    }
}

// ============================================
// NOTIFICATIONS FUNCTIONALITY
// ============================================

async function loadNotifications() {
    try {
        const { data, error } = await supabaseClient
            .from('notifications')
            .select(`
                *,
                sender:sender_id(avatar_url, first_name, last_name),
                post:post_id(content),
                comment:comment_id(content)
            `)
            .eq('user_id', appState.currentUser.id)
            .order('created_at', { ascending: false })
            .limit(50);
        
        if (error) throw error;
        
        appState.notifications = data || [];
        appState.unreadNotifications = data?.filter(n => !n.is_read).length || 0;
        
        updateNotificationBadge();
        
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

async function loadNotificationsList() {
    try {
        const { data, error } = await supabaseClient
            .from('notifications')
            .select(`
                *,
                sender:sender_id(avatar_url, first_name, last_name),
                post:post_id(content),
                comment:comment_id(content)
            `)
            .eq('user_id', appState.currentUser.id)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        appState.notifications = data || [];
        renderNotificationsList();
        
    } catch (error) {
        console.error('Error loading notifications list:', error);
        showInlineMessage('Failed to load notifications', 'error');
    }
}

function renderNotificationsList() {
    const notificationsList = document.getElementById('notificationsList');
    if (!notificationsList) return;
    
    if (appState.notifications.length === 0) {
        notificationsList.innerHTML = `
            <div class="search-placeholder">
                <i class="fas fa-bell-slash fa-3x"></i>
                <h3>No notifications</h3>
                <p>When you get notifications, they'll appear here</p>
            </div>
        `;
        return;
    }
    
    notificationsList.innerHTML = appState.notifications.map(notification => `
        <div class="notification-item ${!notification.is_read ? 'unread' : ''}" data-notification-id="${notification.id}">
            <div class="notification-avatar">
                ${notification.sender ? `
                    <img src="${notification.sender.avatar_url}" alt="${notification.sender.first_name}">
                ` : `
                    <div class="notification-icon">
                        <i class="fas fa-${getNotificationIcon(notification.type)}"></i>
                    </div>
                `}
            </div>
            
            <div class="notification-content">
                <div class="notification-message">
                    ${notification.message}
                    ${notification.post ? `
                        <div class="notification-post-preview">
                            "${truncateText(notification.post.content, 50)}"
                        </div>
                    ` : ''}
                    ${notification.comment ? `
                        <div class="notification-comment-preview">
                            "${truncateText(notification.comment.content, 50)}"
                        </div>
                    ` : ''}
                </div>
                <div class="notification-time">${formatTime(notification.created_at)}</div>
            </div>
            
            <div class="notification-actions">
                ${!notification.is_read ? `
                    <button class="notification-action" onclick="markNotificationAsRead('${notification.id}')" title="Mark as read">
                        <i class="far fa-circle"></i>
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

function getNotificationIcon(type) {
    switch(type) {
        case 'friend_request': return 'user-plus';
        case 'friend_accept': return 'user-check';
        case 'like': return 'heart';
        case 'comment': return 'comment';
        case 'mention': return 'at';
        default: return 'bell';
    }
}

async function markNotificationAsRead(notificationId) {
    try {
        const { error } = await supabaseClient
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId)
            .eq('user_id', appState.currentUser.id);
        
        if (error) throw error;
        
        // Update local state
        const notification = appState.notifications.find(n => n.id === notificationId);
        if (notification) {
            notification.is_read = true;
        }
        
        // Update badge
        appState.unreadNotifications = Math.max(0, appState.unreadNotifications - 1);
        updateNotificationBadge();
        
        // Re-render if on notifications page
        if (appState.currentPage === 'notifications') {
            renderNotificationsList();
        }
        
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
}

async function markAllNotificationsAsRead() {
    try {
        const { error } = await supabaseClient
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', appState.currentUser.id)
            .eq('is_read', false);
        
        if (error) throw error;
        
        // Update local state
        appState.notifications.forEach(n => n.is_read = true);
        appState.unreadNotifications = 0;
        updateNotificationBadge();
        
        if (appState.currentPage === 'notifications') {
            renderNotificationsList();
        }
        
        showInlineMessage('All notifications marked as read', 'success');
        
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        showInlineMessage('Failed to mark all as read', 'error');
    }
}

function updateNotificationBadge() {
    const badge = document.getElementById('notificationBadge');
    const count = document.getElementById('notificationCount');
    
    if (badge && count) {
        if (appState.unreadNotifications > 0) {
            badge.style.display = 'flex';
            count.textContent = appState.unreadNotifications > 99 ? '99+' : appState.unreadNotifications;
        } else {
            badge.style.display = 'none';
        }
    }
    
    updateBottomNav();
}

function switchNotificationsTab(tab) {
    document.querySelectorAll('.notifications-tab').forEach(el => {
        el.classList.remove('active');
    });
    
    event.target.classList.add('active');
    
    let filteredNotifications = appState.notifications;
    
    switch(tab) {
        case 'unread':
            filteredNotifications = appState.notifications.filter(n => !n.is_read);
            break;
        case 'friend_requests':
            filteredNotifications = appState.notifications.filter(n => n.type === 'friend_request');
            break;
    }
    
    renderFilteredNotifications(filteredNotifications);
}

function renderFilteredNotifications(filteredNotifications) {
    const notificationsList = document.getElementById('notificationsList');
    if (!notificationsList) return;
    
    if (filteredNotifications.length === 0) {
        notificationsList.innerHTML = `
            <div class="search-placeholder">
                <i class="fas fa-inbox fa-3x"></i>
                <h3>No notifications</h3>
                <p>There are no notifications in this category</p>
            </div>
        `;
        return;
    }
    
    const originalNotifications = appState.notifications;
    appState.notifications = filteredNotifications;
    renderNotificationsList();
    appState.notifications = originalNotifications;
}

async function refreshNotifications() {
    await loadNotificationsList();
    showInlineMessage('Notifications refreshed', 'success');
}

// ============================================
// POST FUNCTIONS (FIXED)
// ============================================

async function loadPosts() {
    try {
        const { data: posts, error } = await supabaseClient
            .from('posts')
            .select(`
                *,
                profiles(first_name, last_name, avatar_url, username),
                post_likes(count),
                comments(count)
            `)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        appState.posts = posts || [];
        renderPosts();
        
        // Load liked posts for current user
        if (appState.currentUser) {
            await loadLikedPosts();
        }
        
    } catch (error) {
        console.error('Error loading posts:', error);
        showInlineMessage('Failed to load posts', 'error');
    }
}

async function loadLikedPosts() {
    try {
        const { data, error } = await supabaseClient
            .from('post_likes')
            .select('post_id')
            .eq('user_id', appState.currentUser.id);
        
        if (error) throw error;
        
        data.forEach(like => {
            appState.likedPosts.add(like.post_id);
        });
        
    } catch (error) {
        console.error('Error loading liked posts:', error);
    }
}

function renderPosts() {
    const postsContainer = document.getElementById('postsContainer');
    if (!postsContainer) return;
    
    if (appState.posts.length === 0) {
        postsContainer.innerHTML = `
            <div style="text-align: center; padding: 40px; background: white; border-radius: 12px;">
                <i class="fas fa-newspaper" style="font-size: 60px; color: #e4e6eb; margin-bottom: 16px;"></i>
                <h3 style="color: #65676b; margin-bottom: 8px;">No Posts Yet</h3>
                <p style="color: #b0b3b8;">Be the first to share something!</p>
                <button class="btn btn-primary" onclick="openCreatePostModal()" style="margin-top: 16px;">
                    Create First Post
                </button>
            </div>
        `;
        return;
    }
    
    postsContainer.innerHTML = appState.posts.map(post => {
        const isLiked = appState.likedPosts.has(post.id);
        const likeCount = post.post_likes[0]?.count || 0;
        const commentCount = post.comments[0]?.count || 0;
        const hasMedia = post.image_url;
        
        return `
            <div class="post-card" data-post-id="${post.id}">
                <div class="post-header">
                    <img src="${post.profiles.avatar_url}" alt="${post.profiles.first_name}" class="user-avatar">
                    <div class="post-user-info">
                        <h4>${post.profiles.first_name} ${post.profiles.last_name}</h4>
                        ${post.profiles.username ? `<p class="post-username">@${post.profiles.username}</p>` : ''}
                        <p>${formatTime(post.created_at)}</p>
                    </div>
                </div>
                
                <div class="post-content">
                    ${post.content ? `
                        <div class="post-text">${post.content}</div>
                    ` : ''}
                    
                    ${hasMedia ? `
                        <div class="post-media-container">
                            <img src="${post.image_url}" alt="Post media" class="post-media" onerror="this.src='https://placehold.co/600x400/e4e6eb/65676b?text=Image+Not+Found'">
                        </div>
                    ` : ''}
                </div>
                
                <div class="post-footer">
                    <div class="post-stats">
                        <span><i class="fas fa-heart" style="color: #f72585;"></i> ${likeCount} likes</span>
                        <span><i class="fas fa-comment"></i> ${commentCount} comments</span>
                    </div>
                    
                    <div class="post-actions-footer">
                        <div class="post-action-footer ${isLiked ? 'active' : ''}" onclick="toggleLike('${post.id}', this)">
                            <i class="fas fa-heart ${isLiked ? 'fas' : 'far'}"></i> Like
                        </div>
                        <div class="post-action-footer" onclick="toggleComments('${post.id}')">
                            <i class="far fa-comment"></i> Comment
                        </div>
                        ${post.user_id === appState.currentUser?.id ? `
                            <div class="post-action-footer" onclick="deletePost('${post.id}')" style="color: #f72585;">
                                <i class="fas fa-trash"></i> Delete
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                <div class="comments-section" id="comments-${post.id}" style="display: none;">
                    <div class="comments-header">
                        <h4>Comments (${commentCount})</h4>
                        <button class="close-comments" onclick="closeComments('${post.id}')">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="comments-list" id="comments-list-${post.id}">
                        <div class="loading-comments">
                            <div class="spinner" style="width: 20px; height: 20px;"></div>
                            <p>Loading comments...</p>
                        </div>
                    </div>
                    
                    <div class="add-comment">
                        <img src="${appState.currentProfile?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}" 
                             alt="Your avatar" class="comment-avatar">
                        <div class="comment-input-wrapper">
                            <textarea class="comment-input" id="comment-input-${post.id}" 
                                      placeholder="Write a comment..." rows="1"></textarea>
                        </div>
                        <button class="comment-submit" onclick="addComment('${post.id}')">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    // Add event listeners for comment inputs
    appState.posts.forEach(post => {
        const commentInput = document.getElementById(`comment-input-${post.id}`);
        if (commentInput) {
            commentInput.addEventListener('input', function() {
                this.style.height = 'auto';
                this.style.height = Math.min(this.scrollHeight, 100) + 'px';
            });
            
            commentInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    addComment(post.id);
                }
            });
        }
    });
}

async function toggleLike(postId, button) {
    if (!appState.currentUser) {
        showInlineMessage('Please login to like posts', 'error');
        return;
    }
    
    try {
        const icon = button.querySelector('i');
        const isCurrentlyLiked = icon.classList.contains('fas');
        
        // Update UI immediately
        if (isCurrentlyLiked) {
            icon.classList.remove('fas');
            icon.classList.add('far');
            button.classList.remove('active');
            appState.likedPosts.delete(postId);
        } else {
            icon.classList.remove('far');
            icon.classList.add('fas');
            button.classList.add('active');
            appState.likedPosts.add(postId);
        }
        
        // Update server
        if (isCurrentlyLiked) {
            const { error } = await supabaseClient
                .from('post_likes')
                .delete()
                .eq('post_id', postId)
                .eq('user_id', appState.currentUser.id);
            
            if (error) throw error;
        } else {
            const { error } = await supabaseClient
                .from('post_likes')
                .insert({
                    post_id: postId,
                    user_id: appState.currentUser.id
                });
            
            if (error) throw error;
        }
        
        // Update like count display
        const postElement = document.querySelector(`[data-post-id="${postId}"]`);
        if (postElement) {
            const likeCountSpan = postElement.querySelector('.post-stats span:first-child');
            if (likeCountSpan) {
                const currentText = likeCountSpan.textContent;
                const currentCount = parseInt(currentText.match(/\d+/)[0]) || 0;
                const newCount = isCurrentlyLiked ? Math.max(0, currentCount - 1) : currentCount + 1;
                likeCountSpan.innerHTML = `<i class="fas fa-heart" style="color: #f72585;"></i> ${newCount} likes`;
            }
        }
        
    } catch (error) {
        console.error('Error toggling like:', error);
        showInlineMessage('Failed to update like', 'error');
        
        // Revert UI on error
        const icon = button.querySelector('i');
        if (icon.classList.contains('fas')) {
            icon.classList.remove('fas');
            icon.classList.add('far');
            button.classList.remove('active');
            appState.likedPosts.delete(postId);
        } else {
            icon.classList.remove('far');
            icon.classList.add('fas');
            button.classList.add('active');
            appState.likedPosts.add(postId);
        }
    }
}

async function toggleComments(postId) {
    const commentsSection = document.getElementById(`comments-${postId}`);
    const isVisible = commentsSection.style.display !== 'none';
    
    if (isVisible) {
        commentsSection.style.display = 'none';
    } else {
        commentsSection.style.display = 'block';
        await loadComments(postId);
    }
}

function closeComments(postId) {
    document.getElementById(`comments-${postId}`).style.display = 'none';
}

async function loadComments(postId) {
    const commentsList = document.getElementById(`comments-list-${postId}`);
    if (!commentsList) return;
    
    try {
        const { data: comments, error } = await supabaseClient
            .from('comments')
            .select(`
                *,
                profiles(first_name, last_name, avatar_url, username)
            `)
            .eq('post_id', postId)
            .order('created_at', { ascending: true });
        
        if (error) throw error;
        
        appState.currentPostComments[postId] = comments || [];
        renderComments(postId);
        
    } catch (error) {
        console.error('Error loading comments:', error);
        commentsList.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #f72585;">
                <p>Failed to load comments</p>
            </div>
        `;
    }
}

function renderComments(postId) {
    const commentsList = document.getElementById(`comments-list-${postId}`);
    if (!commentsList) return;
    
    const comments = appState.currentPostComments[postId] || [];
    
    if (comments.length === 0) {
        commentsList.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #65676b;">
                <i class="far fa-comment" style="font-size: 32px; margin-bottom: 8px; opacity: 0.5;"></i>
                <p>No comments yet. Be the first to comment!</p>
            </div>
        `;
        return;
    }
    
    commentsList.innerHTML = comments.map(comment => `
        <div class="comment-item" data-comment-id="${comment.id}">
            <img src="${comment.profiles.avatar_url}" alt="${comment.profiles.first_name}" class="comment-avatar">
            <div class="comment-content">
                <div class="comment-header">
                    <div class="comment-user">${comment.profiles.first_name} ${comment.profiles.last_name}</div>
                    ${comment.profiles.username ? `<div class="comment-username">@${comment.profiles.username}</div>` : ''}
                    <div class="comment-time">${formatTime(comment.created_at)}</div>
                </div>
                <div class="comment-text">${comment.content}</div>
                ${comment.user_id === appState.currentUser?.id ? `
                    <div class="comment-actions">
                        <span class="comment-action delete" onclick="deleteComment('${comment.id}', '${postId}')">Delete</span>
                    </div>
                ` : ''}
            </div>
        </div>
    `).join('');
}

async function addComment(postId) {
    if (!appState.currentUser) {
        showInlineMessage('Please login to comment', 'error');
        return;
    }
    
    const commentInput = document.getElementById(`comment-input-${postId}`);
    const content = commentInput.value.trim();
    
    if (!content) {
        showInlineMessage('Please write a comment', 'info');
        return;
    }
    
    const submitBtn = document.querySelector(`#comments-${postId} .comment-submit`);
    submitBtn.disabled = true;
    
    try {
        const { data, error } = await supabaseClient
            .from('comments')
            .insert({
                post_id: postId,
                user_id: appState.currentUser.id,
                content: content
            })
            .select()
            .single();
        
        if (error) throw error;
        
        // Clear input
        commentInput.value = '';
        commentInput.style.height = 'auto';
        submitBtn.disabled = false;
        
        // Refresh comments
        await loadComments(postId);
        
        // Update comment count
        const postElement = document.querySelector(`[data-post-id="${postId}"]`);
        if (postElement) {
            const commentCountSpan = postElement.querySelector('.post-stats span:nth-child(2)');
            if (commentCountSpan) {
                const currentText = commentCountSpan.textContent;
                const currentCount = parseInt(currentText.match(/\d+/)[0]) || 0;
                const newCount = currentCount + 1;
                commentCountSpan.innerHTML = `<i class="fas fa-comment"></i> ${newCount} comments`;
            }
        }
        
        showInlineMessage('Comment added!', 'success');
        
    } catch (error) {
        console.error('Error adding comment:', error);
        showInlineMessage('Failed to add comment', 'error');
        submitBtn.disabled = false;
    }
}

async function deleteComment(commentId, postId) {
    if (!confirm('Delete this comment?')) return;
    
    try {
        const { error } = await supabaseClient
            .from('comments')
            .delete()
            .eq('id', commentId)
            .eq('user_id', appState.currentUser.id);
        
        if (error) throw error;
        
        // Remove from local state
        if (appState.currentPostComments[postId]) {
            appState.currentPostComments[postId] = appState.currentPostComments[postId]
                .filter(comment => comment.id !== commentId);
        }
        
        // Re-render comments
        renderComments(postId);
        
        // Update comment count
        const postElement = document.querySelector(`[data-post-id="${postId}"]`);
        if (postElement) {
            const commentCountSpan = postElement.querySelector('.post-stats span:nth-child(2)');
            if (commentCountSpan) {
                const currentText = commentCountSpan.textContent;
                const currentCount = parseInt(currentText.match(/\d+/)[0]) || 0;
                const newCount = Math.max(0, currentCount - 1);
                commentCountSpan.innerHTML = `<i class="fas fa-comment"></i> ${newCount} comments`;
            }
        }
        
        showInlineMessage('Comment deleted', 'success');
        
    } catch (error) {
        console.error('Error deleting comment:', error);
        showInlineMessage('Failed to delete comment', 'error');
    }
}

// ============================================
// POST CREATION MODAL (FIXED IMAGE URL INPUT)
// ============================================

function openCreatePostModal() {
    const modalHTML = `
        <div class="modal-overlay" onclick="closeModal(event)">
            <div class="modal" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h3>Create Post</h3>
                    <button class="modal-close" onclick="closeModal(event)">×</button>
                </div>
                
                <div class="modal-body">
                    <div class="post-input-container" style="margin-bottom: 20px;">
                        <img src="${appState.currentProfile?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}" 
                             alt="Your avatar" class="user-avatar">
                        <div class="post-user-info">
                            <h4>${appState.currentProfile?.first_name || 'User'} ${appState.currentProfile?.last_name || ''}</h4>
                            <p style="color: #4361ee; font-size: 12px;">
                                <i class="fas fa-globe-americas"></i> Public
                            </p>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <textarea id="modalPostContent" class="form-control" 
                                  placeholder="What's on your mind, ${appState.currentProfile?.first_name || 'User'}?" 
                                  rows="4" style="resize: none; border: none; font-size: 16px; padding: 0;"></textarea>
                    </div>
                    
                    <div class="post-media-preview" id="mediaPreview" style="display: none; margin: 16px 0;">
                        <div class="media-preview-container">
                            <img id="mediaPreviewImage" src="" alt="Preview" class="media-preview">
                            <button class="remove-media" onclick="removeMediaPreview()" title="Remove">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="post-actions" style="border: 1px solid #e4e6eb; border-radius: 8px; padding: 16px; margin: 16px 0;">
                        <h4 style="margin-bottom: 12px; color: #1c1e21;">Add to your post</h4>
                        <div style="display: flex; gap: 12px;">
                            <div class="post-action-btn" onclick="openImageUploadModalInPost()">
                                <i class="fas fa-image" style="color: #45bd62;"></i>
                                <span>Photo/Video</span>
                            </div>
                        </div>
                    </div>
                    
                    <button class="btn btn-primary" id="createPostBtn" onclick="createPostFromModal()" 
                            style="font-size: 15px; font-weight: 600;">
                        <span class="btn-text">Post</span>
                        <div class="spinner-small"></div>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    setTimeout(() => {
        const textarea = document.getElementById('modalPostContent');
        if (textarea) textarea.focus();
    }, 100);
}

function openImageUploadModalInPost() {
    const modalHTML = `
        <div class="modal-overlay" onclick="closeModal(event)">
            <div class="modal" onclick="event.stopPropagation()" style="max-width: 400px;">
                <div class="modal-header">
                    <h3>Add Photo/Video</h3>
                    <button class="modal-close" onclick="closeModal(event)">×</button>
                </div>
                
                <div class="modal-body">
                    <div class="form-group">
                        <label for="imageUrlInput">Image URL</label>
                        <input type="url" id="imageUrlInput" class="form-control" 
                               placeholder="https://example.com/image.jpg" required>
                        <p style="font-size: 12px; color: #65676b; margin-top: 8px;">
                            Enter a direct image URL (must start with http:// or https://)
                        </p>
                    </div>
                    
                    <div id="imagePreview" style="margin-top: 16px; display: none;">
                        <p style="font-size: 14px; color: #31a24c; margin-bottom: 8px;">
                            <i class="fas fa-check-circle"></i> Valid image URL
                        </p>
                    </div>
                    
                    <div id="imageError" style="margin-top: 16px; display: none;">
                        <p style="font-size: 14px; color: #f72585; margin-bottom: 8px;">
                            <i class="fas fa-exclamation-circle"></i> Invalid URL or image not accessible
                        </p>
                    </div>
                    
                    <div style="display: flex; gap: 8px; margin-top: 24px;">
                        <button class="btn btn-secondary" onclick="closeModal()" style="flex: 1;">
                            Cancel
                        </button>
                        <button class="btn btn-primary" onclick="addMediaToPost()" style="flex: 1;" id="addMediaBtn">
                            Add
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    closeModal();
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Add URL validation
    const urlInput = document.getElementById('imageUrlInput');
    const addBtn = document.getElementById('addMediaBtn');
    const preview = document.getElementById('imagePreview');
    const error = document.getElementById('imageError');
    
    if (urlInput) {
        urlInput.addEventListener('input', function() {
            const url = this.value.trim();
            preview.style.display = 'none';
            error.style.display = 'none';
            
            if (url) {
                addBtn.disabled = true;
                addBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Checking...';
                
                // Simple URL validation
                setTimeout(() => {
                    if (url.startsWith('http://') || url.startsWith('https://')) {
                        // Test image load
                        const testImg = new Image();
                        testImg.onload = function() {
                            preview.style.display = 'block';
                            error.style.display = 'none';
                            addBtn.disabled = false;
                            addBtn.innerHTML = 'Add';
                        };
                        testImg.onerror = function() {
                            preview.style.display = 'none';
                            error.style.display = 'block';
                            addBtn.disabled = true;
                            addBtn.innerHTML = 'Add';
                        };
                        testImg.src = url;
                    } else {
                        preview.style.display = 'none';
                        error.style.display = 'block';
                        error.innerHTML = '<p style="font-size: 14px; color: #f72585; margin-bottom: 8px;"><i class="fas fa-exclamation-circle"></i> URL must start with http:// or https://</p>';
                        addBtn.disabled = true;
                        addBtn.innerHTML = 'Add';
                    }
                }, 500);
            } else {
                addBtn.disabled = false;
                addBtn.innerHTML = 'Add';
            }
        });
        
        setTimeout(() => urlInput.focus(), 100);
    }
}

function addMediaToPost() {
    const urlInput = document.getElementById('imageUrlInput');
    const url = urlInput.value.trim();
    
    if (!url) {
        showInlineMessage('Please enter an image URL', 'error');
        return;
    }
    
    // Validate URL format
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        showInlineMessage('URL must start with http:// or https://', 'error');
        return;
    }
    
    // Store in app state
    appState.postMediaUrls['new'] = url;
    
    // Show preview
    const preview = document.getElementById('mediaPreviewImage');
    const previewContainer = document.getElementById('mediaPreview');
    
    if (preview && previewContainer) {
        preview.src = url;
        previewContainer.style.display = 'block';
    }
    
    closeModal();
    openCreatePostModal();
    
    showInlineMessage('Image added to post', 'success');
}

function removeMediaPreview() {
    delete appState.postMediaUrls['new'];
    showInlineMessage('Image removed', 'info');
    closeModal();
    openCreatePostModal();
}

async function createPostFromModal() {
    const content = document.getElementById('modalPostContent')?.value.trim() || '';
    const mediaUrl = appState.postMediaUrls['new'];
    const createBtn = document.getElementById('createPostBtn');
    
    if (!content && !mediaUrl) {
        showInlineMessage('Please write something or add an image', 'info');
        return;
    }
    
    createBtn.classList.add('btn-loading');
    createBtn.disabled = true;
    
    try {
        const { data, error } = await supabaseClient
            .from('posts')
            .insert({
                user_id: appState.currentUser.id,
                content: content,
                image_url: mediaUrl || null
            })
            .select()
            .single();
        
        if (error) throw error;
        
        // Clear state
        delete appState.postMediaUrls['new'];
        
        // Close modal
        closeModal();
        
        // Reload posts
        await loadPosts();
        
        showInlineMessage('Post created successfully!', 'success');
        
    } catch (error) {
        console.error('Error creating post:', error);
        showInlineMessage('Failed to create post', 'error');
    } finally {
        createBtn.classList.remove('btn-loading');
        createBtn.disabled = false;
    }
}

// ============================================
// PROFILE EDIT FUNCTIONALITY (FIXED AVATAR URL INPUT)
// ============================================

function openEditProfileModal() {
    const profile = appState.currentProfile;
    
    const modalHTML = `
        <div class="modal-overlay" onclick="closeModal(event)">
            <div class="modal" onclick="event.stopPropagation()" style="max-width: 500px;">
                <div class="modal-header">
                    <h3>Edit Profile</h3>
                    <button class="modal-close" onclick="closeModal(event)">×</button>
                </div>
                
                <div class="modal-body">
                    <div style="text-align: center; margin-bottom: 24px;">
                        <img src="${profile.avatar_url}" alt="Current avatar" 
                             class="avatar-preview-large" id="currentAvatarPreview">
                        <button class="btn btn-secondary" onclick="changeAvatar()" style="margin-top: 12px;">
                            <i class="fas fa-camera"></i> Change Photo
                        </button>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="editFirstName">First Name *</label>
                            <input type="text" id="editFirstName" class="form-control" 
                                   value="${profile.first_name}" required>
                        </div>
                        <div class="form-group">
                            <label for="editLastName">Last Name *</label>
                            <input type="text" id="editLastName" class="form-control" 
                                   value="${profile.last_name}" required>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="editBio">Bio</label>
                        <textarea id="editBio" class="form-control" rows="3" 
                                  placeholder="Tell people about yourself">${profile.bio || ''}</textarea>
                    </div>
                    
                    <div class="form-group">
                        <label for="editWebsite">Website</label>
                        <input type="url" id="editWebsite" class="form-control" 
                               value="${profile.website || ''}" placeholder="https://example.com">
                    </div>
                    
                    <div class="form-group">
                        <label for="editPhone">Phone Number</label>
                        <input type="tel" id="editPhone" class="form-control" 
                               value="${profile.phone || ''}" placeholder="+1 234 567 8900">
                    </div>
                    
                    <button class="btn btn-primary" onclick="updateProfile()" style="width: 100%; margin-top: 20px;">
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function changeAvatar() {
    const modalHTML = `
        <div class="modal-overlay" onclick="closeModal(event)">
            <div class="modal" onclick="event.stopPropagation()" style="max-width: 400px;">
                <div class="modal-header">
                    <h3>Change Profile Picture</h3>
                    <button class="modal-close" onclick="closeModal(event)">×</button>
                </div>
                
                <div class="modal-body">
                    <div class="form-group">
                        <label for="avatarUrlInput">Image URL</label>
                        <input type="url" id="avatarUrlInput" class="form-control" 
                               placeholder="https://example.com/avatar.jpg" required>
                        <p style="font-size: 12px; color: #65676b; margin-top: 8px;">
                            Enter a direct image URL (must start with http:// or https://)
                        </p>
                    </div>
                    
                    <div id="avatarPreview" style="text-align: center; margin: 16px 0; display: none;">
                        <img id="avatarPreviewImage" src="" alt="Preview" style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover; border: 3px solid #4361ee;">
                        <p style="font-size: 14px; color: #31a24c; margin-top: 8px;">
                            <i class="fas fa-check-circle"></i> Image preview
                        </p>
                    </div>
                    
                    <div id="avatarError" style="margin-top: 16px; display: none;">
                        <p style="font-size: 14px; color: #f72585; margin-bottom: 8px;">
                            <i class="fas fa-exclamation-circle"></i> Invalid URL or image not accessible
                        </p>
                    </div>
                    
                    <div style="display: flex; gap: 8px; margin-top: 24px;">
                        <button class="btn btn-secondary" onclick="closeModal()" style="flex: 1;">
                            Cancel
                        </button>
                        <button class="btn btn-primary" onclick="updateAvatarFromModal()" style="flex: 1;" id="updateAvatarBtn">
                            Update
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    closeModal();
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Add URL validation
    const urlInput = document.getElementById('avatarUrlInput');
    const updateBtn = document.getElementById('updateAvatarBtn');
    const preview = document.getElementById('avatarPreview');
    const previewImg = document.getElementById('avatarPreviewImage');
    const error = document.getElementById('avatarError');
    
    if (urlInput) {
        urlInput.addEventListener('input', function() {
            const url = this.value.trim();
            preview.style.display = 'none';
            error.style.display = 'none';
            
            if (url) {
                updateBtn.disabled = true;
                updateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Checking...';
                
                // Simple URL validation
                setTimeout(() => {
                    if (url.startsWith('http://') || url.startsWith('https://')) {
                        // Test image load
                        const testImg = new Image();
                        testImg.onload = function() {
                            previewImg.src = url;
                            preview.style.display = 'block';
                            error.style.display = 'none';
                            updateBtn.disabled = false;
                            updateBtn.innerHTML = 'Update';
                        };
                        testImg.onerror = function() {
                            preview.style.display = 'none';
                            error.style.display = 'block';
                            updateBtn.disabled = true;
                            updateBtn.innerHTML = 'Update';
                        };
                        testImg.src = url;
                    } else {
                        preview.style.display = 'none';
                        error.style.display = 'block';
                        error.innerHTML = '<p style="font-size: 14px; color: #f72585; margin-bottom: 8px;"><i class="fas fa-exclamation-circle"></i> URL must start with http:// or https://</p>';
                        updateBtn.disabled = true;
                        updateBtn.innerHTML = 'Update';
                    }
                }, 500);
            } else {
                updateBtn.disabled = false;
                updateBtn.innerHTML = 'Update';
            }
        });
        
        setTimeout(() => urlInput.focus(), 100);
    }
}

function updateAvatarFromModal() {
    const urlInput = document.getElementById('avatarUrlInput');
    const url = urlInput.value.trim();
    
    if (!url) {
        showInlineMessage('Please enter an image URL', 'error');
        return;
    }
    
    // Validate URL format
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        showInlineMessage('URL must start with http:// or https://', 'error');
        return;
    }
    
    // Update the preview in the edit modal
    const preview = document.getElementById('currentAvatarPreview');
    if (preview) {
        preview.src = url;
    }
    
    closeModal();
    openEditProfileModal();
    
    showInlineMessage('Avatar updated. Click "Save Changes" to apply.', 'success');
}

async function updateProfile() {
    const firstName = document.getElementById('editFirstName').value.trim();
    const lastName = document.getElementById('editLastName').value.trim();
    const bio = document.getElementById('editBio').value.trim();
    const website = document.getElementById('editWebsite').value.trim();
    const phone = document.getElementById('editPhone').value.trim();
    const avatarPreview = document.getElementById('currentAvatarPreview');
    
    if (!firstName || !lastName) {
        showInlineMessage('First name and last name are required', 'error');
        return;
    }
    
    try {
        let avatarUrl = appState.currentProfile.avatar_url;
        
        // Check if avatar was updated
        if (avatarPreview && avatarPreview.src !== appState.currentProfile.avatar_url) {
            avatarUrl = avatarPreview.src;
        }
        
        const { data, error } = await supabaseClient
            .from('profiles')
            .update({
                first_name: firstName,
                last_name: lastName,
                bio: bio || 'Welcome to my Nexus profile!',
                website: website || null,
                phone: phone || null,
                avatar_url: avatarUrl,
                updated_at: new Date().toISOString()
            })
            .eq('id', appState.currentUser.id)
            .select()
            .single();
        
        if (error) throw error;
        
        appState.currentProfile = data;
        closeModal();
        navigateTo('profile');
        
        showInlineMessage('Profile updated successfully!', 'success');
        
    } catch (error) {
        console.error('Error updating profile:', error);
        showInlineMessage('Failed to update profile', 'error');
    }
}

// ============================================
// USER POSTS LOADING
// ============================================

async function loadUserPosts() {
    try {
        const { data: posts, error } = await supabaseClient
            .from('posts')
            .select(`
                *,
                post_likes(count),
                comments(count)
            `)
            .eq('user_id', appState.currentUser.id)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const postCount = document.getElementById('postCount');
        if (postCount) postCount.textContent = posts?.length || 0;
        
        const totalLikes = posts?.reduce((sum, post) => sum + (post.post_likes[0]?.count || 0), 0) || 0;
        const likeCount = document.getElementById('likeCount');
        if (likeCount) likeCount.textContent = totalLikes;
        
        const container = document.getElementById('profilePostsContainer');
        if (!container) return;
        
        if (!posts || posts.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; background: white; border-radius: 12px; margin-bottom: 16px;">
                    <i class="fas fa-feather-alt" style="font-size: 48px; color: #e4e6eb; margin-bottom: 16px;"></i>
                    <h3 style="color: #65676b; margin-bottom: 8px;">No Posts Yet</h3>
                    <p style="color: #b0b3b8;">Share your first post with the Nexus community!</p>
                    <button class="btn btn-primary" onclick="openCreatePostModal()" style="margin-top: 16px;">
                        Create Your First Post
                    </button>
                </div>
            `;
            return;
        }
        
        container.innerHTML = posts.map(post => `
            <div class="post-card" style="margin-bottom: 16px;">
                <div class="post-header">
                    <img src="${appState.currentProfile.avatar_url}" alt="Your avatar" class="user-avatar">
                    <div class="post-user-info">
                        <h4>${appState.currentProfile.first_name} ${appState.currentProfile.last_name}</h4>
                        ${appState.currentProfile.username ? `<p class="post-username">@${appState.currentProfile.username}</p>` : ''}
                        <p>${formatTime(post.created_at)}</p>
                    </div>
                </div>
                
                <div class="post-content">
                    ${post.content ? `<div class="post-text">${post.content}</div>` : ''}
                    ${post.image_url ? `
                        <div class="post-media-container">
                            <img src="${post.image_url}" alt="Post media" class="post-media" onerror="this.src='https://placehold.co/600x400/e4e6eb/65676b?text=Image+Not+Found'">
                        </div>
                    ` : ''}
                </div>
                
                <div class="post-footer">
                    <div class="post-stats">
                        <span><i class="fas fa-heart" style="color: #f72585;"></i> ${post.post_likes[0]?.count || 0} likes</span>
                        <span><i class="fas fa-comment"></i> ${post.comments[0]?.count || 0} comments</span>
                    </div>
                    <div class="post-actions-footer">
                        <div class="post-action-footer" onclick="deletePost('${post.id}')">
                            <i class="fas fa-trash"></i> Delete
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading user posts:', error);
        showInlineMessage('Failed to load your posts', 'error');
    }
}

async function deletePost(postId) {
    if (!confirm('Delete this post?')) return;
    
    try {
        const { error } = await supabaseClient
            .from('posts')
            .delete()
            .eq('id', postId)
            .eq('user_id', appState.currentUser.id);
        
        if (error) throw error;
        
        await loadUserPosts();
        if (appState.currentPage === 'feed') {
            await loadPosts();
        }
        
        showInlineMessage('Post deleted', 'success');
        
    } catch (error) {
        console.error('Error deleting post:', error);
        showInlineMessage('Failed to delete post', 'error');
    }
}

// ============================================
// MODAL FUNCTIONS
// ============================================

function closeModal(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
        if (!event.target.closest('.modal')) {
            document.querySelector('.modal-overlay')?.remove();
        } else if (event.target.classList.contains('modal-close')) {
            document.querySelector('.modal-overlay')?.remove();
        }
    } else {
        document.querySelector('.modal-overlay')?.remove();
    }
}

// ============================================
// INITIALIZATION
// ============================================

async function initApp() {
    console.log('Initializing app...');
    
    if (!supabaseClient || !supabaseClient.auth) {
        console.error('Supabase client not properly initialized');
        showInlineMessage('Application error', 'error');
        return;
    }
    
    const { data: authListener } = supabaseClient.auth.onAuthStateChange((event, session) => {
        console.log('Auth state changed:', event);
        
        if (event === 'SIGNED_OUT') {
            appState.currentUser = null;
            appState.currentProfile = null;
            appState.notifications = [];
            appState.unreadNotifications = 0;
            appState.friendRequests = [];
            appState.friends = [];
            appState.searchResults = [];
            navigateTo('auth');
        } else if (event === 'SIGNED_IN' && session?.user) {
            appState.currentUser = session.user;
        }
    });
    
    navigateTo('loading');
    
    try {
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
        
        if (authError) {
            console.error('Auth error:', authError);
            navigateTo('auth');
            return;
        }
        
        if (user) {
            appState.currentUser = user;
            
            const { data: profile, error: profileError } = await supabaseClient
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();
            
            if (profileError || !profile) {
                console.warn('Profile not found, creating default...');
                
                const { data: newProfile, error: createError } = await supabaseClient
                    .from('profiles')
                    .insert({
                        id: user.id,
                        first_name: user.user_metadata?.first_name || 'User',
                        last_name: user.user_metadata?.last_name || 'Person',
                        date_of_birth: new Date().toISOString().split('T')[0]
                    })
                    .select()
                    .single();
                
                if (createError) {
                    console.error('Create profile error:', createError);
                    appState.currentProfile = {
                        id: user.id,
                        first_name: user.user_metadata?.first_name || 'User',
                        last_name: user.user_metadata?.last_name || 'Person',
                        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
                        bio: 'Welcome to my Nexus profile!'
                    };
                } else {
                    appState.currentProfile = newProfile;
                }
            } else {
                appState.currentProfile = profile;
            }
            
            navigateTo('feed');
        } else {
            navigateTo('auth');
        }
        
    } catch (error) {
        console.error('Initialization error:', error);
        navigateTo('auth');
    }
}

// ============================================
// DOM CONTENT LOADED
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded');
    
    mainContent = document.getElementById('mainContent');
    bottomNav = document.getElementById('bottomNav');
    notificationBadge = document.getElementById('notificationBadge');
    notificationCount = document.getElementById('notificationCount');
    
    initApp();
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        closeModal();
    }
});

window.addEventListener('popstate', () => {
    closeModal();
});