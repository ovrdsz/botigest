import React, { createContext, useState, useContext, useEffect } from 'react';
import { CashShiftRepository } from '../repositories/cashShiftRepository';
import { useAuth } from './AuthContext';

const CashContext = createContext(null);

export const CashProvider = ({ children }) => {
    const { user } = useAuth();
    const [currentShift, setCurrentShift] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            checkOpenShift();
        } else {
            setCurrentShift(null);
            setLoading(false);
        }
    }, [user]);

    const checkOpenShift = async () => {
        try {
            const shift = await CashShiftRepository.getCurrentOpenShift(user.id);
            setCurrentShift(shift);
        } catch (error) {
            console.error('Error checking open shift:', error);
        } finally {
            setLoading(false);
        }
    };

    const getShiftDetails = async () => {
        if (!currentShift) return null;
        try {
            const totals = await CashShiftRepository.getShiftSalesTotal(currentShift.id);
            return {
                ...currentShift,
                ...totals
            };
        } catch (error) {
            console.error('Error getting shift details:', error);
            return null;
        }
    };

    const openShift = async (startAmount) => {
        try {
            const id = await CashShiftRepository.create(user.id, startAmount);
            await checkOpenShift();
            return { success: true };
        } catch (error) {
            console.error('Error opening shift:', error);
            return { success: false, error: error.message };
        }
    };

    const closeShift = async (endAmount, expectedAmount, notes) => {
        try {
            if (!currentShift) return { success: false, error: 'No active shift' };
            await CashShiftRepository.close(currentShift.id, endAmount, expectedAmount, notes, user.id);
            setCurrentShift(null);
            return { success: true };
        } catch (error) {
            console.error('Error closing shift:', error);
            return { success: false, error: error.message };
        }
    };

    return (
        <CashContext.Provider value={{ currentShift, openShift, closeShift, loading, refreshShift: checkOpenShift, getShiftDetails }}>
            {children}
        </CashContext.Provider>
    );
};

export const useCash = () => useContext(CashContext);
