import React, { useRef, useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { InputOtp } from 'primereact/inputotp';
import { Toast } from 'primereact/toast';

import 'primeflex/primeflex.css';
import { Card } from 'primereact/card';
import { Divider } from 'primereact/divider';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const toast = useRef(null);
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();
        if (username === '' || password === '') {
            setError('Kullanıcı adı ve şifre boş olamaz!');
            toast.current.show({ severity: 'warn', summary: 'Uyarı', detail: 'Kullanıcı adı ve şifre boş olamaz!', life: 3000 });
        } else if (username === 'admin' && password === '123456') {
            toast.current.show({ severity: 'success', summary: 'Başarılı', detail: 'Giriş Başarılı', life: 3000 });
            setError('');
            navigate('main')
        } else {
            toast.current.show({ severity: 'error', summary: 'Hata', detail: 'Yanlış kullanıcı adı veya şifre!', life: 3000 });
            setError('Yanlış kullanıcı adı veya şifre!');
        }
    };

    return (
        <div className="flex justify-content-center align-items-center" style={{ height: '100vh' }}>
            <Toast ref={toast} />
            <Card className="w-8 border-round-3xl border-1 border-blue-600" >
                <h2 className="flex align-items-center justify-content-center mb-4">Giriş Yap</h2>

                <form className='flex flex-column align-items-center justify-content-between px-2' onSubmit={handleLogin}>
                    <div className="grid gap-3">
                        <div className='flex align-items-center w-full'>
                            <label className='w-4' htmlFor="username">Kullanıcı Adı</label>
                            <InputText
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-8"
                                placeholder="Kullanıcı Adı"
                            />
                        </div>
                        <div className='flex align-items-center w-full'>
                            <label className='w-4' htmlFor="password">Şifre</label>
                            <InputOtp className='w-8' id='password' value={password} onChange={(e) => setPassword(e.value)} integerOnly length={6} />
                        </div>
                    </div>
                    <Divider />
                    <Button label="Giriş Yap" type="submit" className="w-12" />
                </form>
            </Card>
        </div>
    );
};

export default Login;
