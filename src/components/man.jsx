import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    AppBar, 
    Toolbar, 
    Typography, 
    Button, 
    Container, 
    Grid, 
    Card, 
    CardContent, 
    Collapse,
    Snackbar,
    Alert,
    TextField,
    Box
} from '@mui/material';
import useGameStore from '../store/gameStore';
import './man.css';

const ManagerConsole = () => {
    const navigate = useNavigate();
    const { logout, token } = useGameStore();
    const [users, setUsers] = useState([]);
    const [bankInfo, setBankInfo] = useState(null);
    const [playerBets, setPlayerBets] = useState([]);
    const [transactionSummary, setTransactionSummary] = useState([]);
    const [wagerBets, setWagerBets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [upiDetails, setUpiDetails] = useState(null);
    const [upiTransactions, setUpiTransactions] = useState([]);
    const [formData, setFormData] = useState({
        phone: '',
        qrImage: null,
        password: ''
    });
    const [successMessage, setSuccessMessage] = useState('');
    const [stats, setStats] = useState({
        totalGames: 0,
        highestMultiplier: 0,
        activePlayers: 0
    });

    const [shuffleTransactions, setShuffleTransactions] = useState([]);
    const [tossTransactions, setTossTransactions] = useState([]);
    const [mineTransactions, setMineTransactions] = useState([]);

    const fetchShuffleTransactions = async () => {
        fetchData('http://localhost:8000/api/manager/shuffle_transactions', setShuffleTransactions);
    };

    const fetchTossTransactions = async () => {
        fetchData('http://localhost:8000/api/manager/toss_transactions', setTossTransactions);
    };

    const fetchMineTransactions = async () => {
        fetchData('http://localhost:8000/api/manager/mine_transactions', setMineTransactions);
    };

    // State for managing section visibility
    const [openSections, setOpenSections] = useState({
        users: false,
        bank: false,
        transactions: false,
        wagers: false,
        upi: false
    });

    const [openTransactions, setOpenTransactions] = useState(false);

    const toggleSection = (section) => {
        setOpenSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const fetchData = async (url, setter) => {
        try {
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText);
            }
            const data = await response.json();
            setter(data);
        } catch (err) {
            setError(`Error fetching data: ${err.message}`);
        }
    };

    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }

        setLoading(true);
        fetchData('http://localhost:8000/api/manager/users', setUsers);
        fetchData('http://localhost:8000/api/manager/bank', setBankInfo);
        fetchData('http://localhost:8000/api/manager/player_bets', setPlayerBets);
        fetchData('http://localhost:8000/api/manager/transaction_summary', setTransactionSummary);
        fetchData('http://localhost:8000/api/manager/wager_bets', setWagerBets);
        fetchData('http://localhost:8000/api/manager/upi_details', setUpiDetails);
        fetchData('http://localhost:8000/api/manager/upi_transactions', setUpiTransactions);
        
        setStats({
            totalGames: transactionSummary.length,
            highestMultiplier: Math.max(...transactionSummary.map(ts => ts.cash_out_multiplier)),
            activePlayers: users.length
        });

        setLoading(false);
    }, [token, navigate]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setFormData(prev => ({
            ...prev,
            qrImage: file
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Create form data for file upload
            const formDataToSend = new FormData();
            formDataToSend.append('phone_number', formData.phone);
            formDataToSend.append('upi_code', formData.password);
            
            if (formData.qrImage) {
                formDataToSend.append('qr_image', formData.qrImage);
            }

            const response = await fetch(`http://localhost:8000/api/manager/upload-qr`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formDataToSend
            });

            if (!response.ok) {
                throw new Error('Failed to update UPI details');
            }

            setSuccessMessage('UPI details updated successfully!');
            // Refresh UPI details
            fetchData('http://localhost:8000/api/manager/upi_details', setUpiDetails);
            // Reset form
            setFormData({
                phone: '',
                qrImage: null,
                password: ''
            });
        } catch (err) {
            setError(`Error updating UPI details: ${err.message}`);
        }
    };

    useEffect(() => {
        console.log('Wagers section open:', openSections.wagers);
        console.log('Wager bets:', wagerBets);
    }, [openSections.wagers, wagerBets]);

    const downloadTransactions = () => {
        const content = upiTransactions.map(txn => 
            `User: ${txn.user_name}\nPhone: ${txn.phone_number}\nAmount: $${txn.amount.toFixed(2)}\nDate: ${new Date(txn.created_at).toLocaleString()}\n\n`
        ).join('---\n');

        const blob = new Blob([content], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `upi_transactions_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    };

    return (
        <Container>
            <AppBar position="static" style={{ backgroundColor: '#222' }}>
                <Toolbar>
                    <Typography variant="h6" sx={{ flexGrow: 1 }}>
                        Manager Portal
                    </Typography>
                    <Button color="inherit" onClick={handleLogout}>Logout</Button>
                </Toolbar>
            </AppBar>

            {loading && <Typography>Loading...</Typography>}
            {error && (
                <Snackbar open={Boolean(error)} autoHideDuration={6000} onClose={() => setError(null)}>
                    <Alert onClose={() => setError(null)} severity="error">
                        {error}
                    </Alert>
                </Snackbar>
            )}

            {successMessage && (
                <Snackbar open={Boolean(successMessage)} autoHideDuration={6000} onClose={() => setSuccessMessage('')}>
                    <Alert onClose={() => setSuccessMessage('')} severity="success">
                        {successMessage}
                    </Alert>
                </Snackbar>
            )}

            {/* Navigation Buttons */}
            <div className="nav-menu">
                <button 
                    className={`nav-button ${openSections.users ? 'active' : ''}`}
                    onClick={() => toggleSection('users')}
                >
                    Users
                </button>
                <button 
                    className={`nav-button ${openSections.bank ? 'active' : ''}`}
                    onClick={() => toggleSection('bank')}
                >
                    Bank Info
                </button>
                <button 
                    className={`nav-button ${openSections.transactions ? 'active' : ''}`}
                    onClick={() => toggleSection('transactions')}
                >
                    Transactions
                </button>
                <button 
                    className={`nav-button ${openSections.wagers ? 'active' : ''}`}
                    onClick={() => toggleSection('wagers')}
                >
                    Wagers
                </button>
                <button 
                    className={`nav-button ${openSections.upi ? 'active' : ''}`}
                    onClick={() => toggleSection('upi')}
                >
                    UPI
                </button>
                <button 
                    className={`nav-button ${openSections.shuffle ? 'active' : ''}`}
                    onClick={() => toggleSection('shuffle')}
                >
                    Shuffle TXN
                </button>
                <button 
                    className={`nav-button ${openSections.toss ? 'active' : ''}`}
                    onClick={() => toggleSection('toss')}
                >
                    Toss TXN
                </button>
                <button 
                    className={`nav-button ${openSections.mine ? 'active' : ''}`}
                    onClick={() => toggleSection('mine')}
                >
                    Mine TXN
                </button>
            </div>

            <Grid container spacing={3} sx={{ marginTop: 2, marginRight: '200px' }}>
                {/* Users Section */}
                <Grid item xs={12}>
                    <Collapse in={openSections.users}>
                        <Card variant="outlined" sx={{ backgroundColor: '#282c34', color: '#fff' }}>
                            <CardContent>
                                <Typography variant="h5" className="section-title">Users</Typography>
                                <div className="table-container">
                                    <div className="scrollable-table">
                                        <table className="data-table">
                                            <thead className="table-header">
                                                <tr>
                                                    <th>ID</th>
                                                    <th>Username</th>
                                                    <th>Balance</th>
                                                    <th>Total Bet</th>
                                                    <th>Phone</th>
                                                    <th>Email</th>
                                                    <th>Role</th>
                                                    <th>Joined</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {users.map(user => (
                                                    <tr key={user.id} className="table-row">
                                                        <td><div className="id-badge">{user.id}</div></td>
                                                        <td>{user.username}</td>
                                                        <td className="money-value">${user.balance}</td>
                                                        <td className="money-value">${user.total_bet_amount}</td>
                                                        <td>{user.phone}</td>
                                                        <td>{user.email}</td>
                                                        <td><span className="status-badge active">{user.role}</span></td>
                                                        <td className="timestamp">{new Date(user.created_at).toLocaleString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Collapse>
                </Grid>

                {/* Bank Information Section */}
                <Grid item xs={12}>
                    <Collapse in={openSections.bank}>
                        <Card variant="outlined" sx={{ backgroundColor: '#282c34', color: '#fff' }}>
                            <CardContent>
                                <Typography variant="h5" className="section-title">Game Bank</Typography>
                                {bankInfo && (
                                    <div className="bank-info">
                                        <div>
                                            <div className="bank-label">Capital</div>
                                            <div className="bank-value">${bankInfo.capital.toFixed(2)}</div>
                                        </div>
                                        <div>
                                            <div className="bank-label">Profit Bucket</div>
                                            <div className="bank-value">${bankInfo.profit_bucket.toFixed(2)}</div>
                                        </div>
                                        <div>
                                            <div className="bank-label">Last Updated</div>
                                            <div className="bank-value">
                                                {new Date(bankInfo.updated_at).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </Collapse>
                </Grid>

                {/* Transactions Section */}
                <Grid item xs={12}>
                    <Collapse in={openSections.transactions}>
                    <Card variant="outlined" sx={{ backgroundColor: '#282c34', color: '#fff' }}>
                        <CardContent>
                                <Typography variant="h5" className="section-title">Transaction Summaries</Typography>
                                <div className="table-container">
                                    <div className="scrollable-table">
                                        <table className="data-table">
                                            <thead className="table-header">
                                                <tr>
                                                    <th>ID</th>
                                                    <th>Time Stamp</th>
                                                    <th>Username</th>
                                                    <th>Bet Amount</th>
                                                    <th>Cash Out X</th>
                                                    <th>Loss</th>
                                                    <th>Profit</th>
                                                    <th>Capital</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {transactionSummary.map(summary => (
                                                    <tr key={summary.id} className="table-row">
                                                        <td><div className="id-badge">{summary.id}</div></td>
                                                        <td className="timestamp">{new Date(summary.timestamp).toLocaleString()}</td>
                                                        <td>{summary.username}</td>
                                                        <td className="money-value">${summary.bet_amount.toFixed(2)}</td>
                                                        <td>{summary.cash_out_multiplier}x</td>
                                                        <td className="money-value">${summary.user_profit.toFixed(2)}</td>
                                                        <td className="money-value">${summary.house_profit.toFixed(2)}</td>
                                                        <td className="money-value">${summary.bank_capital.toFixed(2)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                        </CardContent>
                    </Card>
                    </Collapse>
                </Grid>

                {/* Wagers Section */}
                <Grid item xs={12}>
                    <Collapse in={openSections.wagers}>
                    <Card variant="outlined" sx={{ backgroundColor: '#282c34', color: '#fff' }}>
                        <CardContent>
                                <Typography variant="h5" className="section-title">Wager Bets</Typography>
                                <div className="table-container">
                                    <div className="scrollable-table">
                                        <table className="data-table">
                                            <thead className="table-header">
                                                <tr>
                                                    <th>ID</th>
                                                    <th>User ID</th>
                                                    <th>Bet Amount</th>
                                                    <th>Bet Choice</th>
                                                    <th>Round ID</th>
                                                    <th>Status</th>
                                                    <th>Active</th>
                                                    <th>Created At</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {wagerBets.map(wager => (
                                                    <tr key={wager.id} className="table-row">
                                                        <td><div className="id-badge">{wager.id}</div></td>
                                                        <td>{wager.user_id}</td>
                                                        <td className="money-value">${wager.bet_amount.toFixed(2)}</td>
                                                        <td>{wager.bet_choice}</td>
                                                        <td>{wager.round_id}</td>
                                                        <td>
                                                            <span className={`status-badge ${wager.status.toLowerCase()}`}>
                                                                {wager.status}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className={`status-badge ${wager.is_active ? 'active' : 'inactive'}`}>
                                                                {wager.is_active ? 'Yes' : 'No'}
                                                            </span>
                                                        </td>
                                                        <td className="timestamp">{new Date(wager.created_at).toLocaleString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                        </CardContent>
                    </Card>
                    </Collapse>
                </Grid>

                {/* UPI Section */}
                <Grid item xs={12}>
                    <Collapse in={openSections.upi}>
                    <Card variant="outlined" sx={{ backgroundColor: '#282c34', color: '#fff' }}>
                        <CardContent>
                                <Typography variant="h5" className="section-title">UPI Management</Typography>
                                
                                {/* Current UPI Details */}
                                {upiDetails && upiDetails[0] && (
                                    <Box sx={{ mb: 4 }}>
                                        <Typography variant="h6" sx={{ mb: 2 }}>Current UPI Details</Typography>
                                        <div className="upi-info">
                                            <div>Phone: {upiDetails[0].phone_number}</div>
                                            <div>UPI Code: {upiDetails[0].upi_code}</div>
                                            <div>Created At: {new Date(upiDetails[0].created_at).toLocaleString()}</div>
                                            {upiDetails[0].qr_image_path && (
                                                <div>
                                                    <Typography>Current QR Code:</Typography>
                                                    <img 
                                                        src={`http://localhost:8000${upiDetails[0].qr_image_path}`}
                                                        alt="UPI QR Code"
                                                        style={{ maxWidth: '200px', marginTop: '10px' }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </Box>
                                )}

                                {/* UPI Update Form */}
                                <form onSubmit={handleSubmit} className="upi-form">
                                    <TextField
                                        fullWidth
                                        label="Phone Number"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        margin="normal"
                                        required
                                        sx={{ mb: 2 }}
                                    />
                                    
                                    <Box sx={{ mb: 2 }}>
                                        <input
                                            type="file"
                                            accept="image/png,image/jpeg,image/jpg"
                                            onChange={handleFileChange}
                                            style={{ display: 'none' }}
                                            id="qr-upload"
                                        />
                                        <label htmlFor="qr-upload">
                                            <Button
                                                component="span"
                                                variant="outlined"
                                                sx={{ color: '#fff', borderColor: '#4facfe' }}
                                            >
                                                Upload QR Code
                                            </Button>
                                        </label>
                                        {formData.qrImage && (
                                            <Typography sx={{ mt: 1 }}>
                                                Selected: {formData.qrImage.name}
                                            </Typography>
                                        )}
                                    </Box>

                                    <TextField
                                        fullWidth
                                        type="password"
                                        label="Manager Password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        margin="normal"
                                        required
                                        sx={{ mb: 2 }}
                                    />

                                    <Button
                                        type="submit"
                                        variant="contained"
                                        sx={{
                                            background: 'linear-gradient(90deg, #00f2fe 0%, #4facfe 100%)',
                                            '&:hover': {
                                                background: 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)',
                                            }
                                        }}
                                    >
                                        Update UPI Details
                                    </Button>
                                </form>

                                {/* UPI Transactions Button and Section */}
                                <Box sx={{ mt: 4 }}>
                                    <Button
                                        variant="contained"
                                        onClick={() => setOpenTransactions(!openTransactions)}
                                        sx={{
                                            background: 'linear-gradient(90deg, #4CAF50 0%, #45a049 100%)',
                                            '&:hover': {
                                                background: 'linear-gradient(90deg, #45a049 0%, #4CAF50 100%)',
                                            },
                                            width: '100%',
                                            mb: 2
                                        }}
                                    >
                                        {openTransactions ? 'Hide Transactions' : 'Show Transactions'}
                                    </Button>

                                    <Collapse in={openTransactions}>
                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                                            <Button
                                                variant="outlined"
                                                onClick={() => downloadTransactions()}
                                                sx={{ color: '#fff', borderColor: '#4facfe' }}
                                            >
                                                Download Transactions
                                            </Button>
                                        </Box>
                                        
                                        <div className="transactions-container">
                                            <div style={{ width: '100%', overflowX: 'auto' }}>
                                                <table className="data-table upi-transactions">
                                                    <thead className="table-header">
                                                        <tr>
                                                            <th>User</th>
                                                            <th>Phone</th>
                                                            <th>Amount</th>
                                                            <th>Date</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {upiTransactions.map(txn => (
                                                            <tr key={txn.id} className="table-row">
                                                                <td>{txn.user_name}</td>
                                                                <td>{txn.phone_number}</td>
                                                                <td className="money-value">${txn.amount.toFixed(2)}</td>
                                                                <td className="timestamp">
                                                                    {new Date(txn.created_at).toLocaleString()}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </Collapse>
                                </Box>
                        </CardContent>
                    </Card>
                    </Collapse>
                </Grid>

                {/* Shuffle Transactions Section */}
                <Grid item xs={12}>
                    <Collapse in={openSections.shuffle}>
                        <Card variant="outlined" sx={{ backgroundColor: '#282c34', color: '#fff' }}>
                            <CardContent>
                                <Typography variant="h5" className="section-title">Shuffle Transactions</Typography>
                                <div className="table-container">
                                    <div className="scrollable-table">
                                        <table className="data-table">
                                            <thead className="table-header">
                                                <tr>
                                                    <th>ID</th>
                                                    <th>Username</th>
                                                    <th>Bet Amount</th>
                                                    <th>Bet Info</th>
                                                    <th>User Profit</th>
                                                    <th>User Loss</th>
                                                    <th>Created At</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {shuffleTransactions.map(txn => (
                                                    <tr key={txn.id} className="table-row">
                                                        <td><div className="id-badge">{txn.id}</div></td>
                                                        <td>{txn.username}</td>
                                                        <td className="money-value">${txn.bet_amount.toFixed(2)}</td>
                                                        <td>{txn.bet_info}</td>
                                                        <td className="money-value">${txn.user_profit?.toFixed(2) || '0.00'}</td>
                                                        <td className="money-value">${txn.user_loss?.toFixed(2) || '0.00'}</td>
                                                        <td className="timestamp">{new Date(txn.created_at).toLocaleString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Collapse>
                </Grid>

                {/* Toss Transactions Section */}
                <Grid item xs={12}>
                    <Collapse in={openSections.toss}>
                        <Card variant="outlined" sx={{ backgroundColor: '#282c34', color: '#fff' }}>
                            <CardContent>
                                <Typography variant="h5" className="section-title">Toss Transactions</Typography>
                                <div className="table-container">
                                    <div className="scrollable-table">
                                        <table className="data-table">
                                            <thead className="table-header">
                                                <tr>
                                                    <th>ID</th>
                                                    <th>Username</th>
                                                    <th>Bet Amount</th>
                                                    <th>Bet Choice</th>
                                                    <th>Outcome</th>
                                                    <th>Created At</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {tossTransactions.map(txn => (
                                                    <tr key={txn.id} className="table-row">
                                                        <td><div className="id-badge">{txn.id}</div></td>
                                                        <td>{txn.username}</td>
                                                        <td className="money-value">${txn.bet_amount.toFixed(2)}</td>
                                                        <td>{txn.bet_choice}</td>
                                                        <td>{txn.outcome}</td>
                                                        <td className="timestamp">{new Date(txn.created_at).toLocaleString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Collapse>
                </Grid>

                {/* Mine Transactions Section */}
                <Grid item xs={12}>
                    <Collapse in={openSections.mine}>
                        <Card variant="outlined" sx={{ backgroundColor: '#282c34', color: '#fff' }}>
                            <CardContent>
                                <Typography variant="h5" className="section-title">Mine Transactions</Typography>
                                <div className="table-container">
                                    <div className="scrollable-table">
                                        <table className="data-table">
                                            <thead className="table-header">
                                                <tr>
                                                    <th>ID</th>
                                                    <th>Username</th>
                                                    <th>Bet Amount</th>
                                                    <th>Bet Info</th>
                                                    <th>User Profit</th>
                                                    <th>User Loss</th>
                                                    <th>Created At</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {mineTransactions.map(txn => (
                                                    <tr key={txn.id} className="table-row">
                                                        <td><div className="id-badge">{txn.id}</div></td>
                                                        <td>{txn.username}</td>
                                                        <td className="money-value">${txn.bet_amount.toFixed(2)}</td>
                                                        <td>{txn.bet_info}</td>
                                                        <td className="money-value">${txn.user_profit?.toFixed(2) || '0.00'}</td>
                                                        <td className="money-value">${txn.user_loss?.toFixed(2) || '0.00'}</td>
                                                        <td className="timestamp">{new Date(txn.created_at).toLocaleString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Collapse>
                </Grid>
            </Grid>

            {/* Stats Container */}
            <div className="stats-container">
                <div className="stat">
                    <div className="number">{stats.totalGames}</div>
                    <div className="label">Total Games</div>
                </div>
                <div className="stat">
                    <div className="number">{stats.highestMultiplier}x</div>
                    <div className="label">Highest Multiplier</div>
                </div>
                <div className="stat">
                    <div className="number">{stats.activePlayers}</div>
                    <div className="label">Active Players</div>
                </div>
            </div>

            <footer style={{ marginTop: '20px', textAlign: 'center', color: '#fff' }}>
                <Typography variant="body2">
                    Contact us at: <a href="mailto:bk1989@tutanota.com" style={{ color: '#61dafb' }}>bk1989@tutanota.com</a> for any assistance 😊
                </Typography>
            </footer>
        </Container>
    );
};

export default ManagerConsole;