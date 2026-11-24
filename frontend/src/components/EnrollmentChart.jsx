
import { useEffect, useState } from "react";

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from "recharts";

import api from "../services/api";

function EnrollmentChart() {
    const currentYear = new Date().getFullYear();

    const [year, setYear] = useState(currentYear);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchEnrollmentStats = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await api.get("/dashboard/enrollments", {
                    params: { year }
                });

                const monthlyData = response.data.monthlyEnrollments.map(
                    (item) => ({
                        month: item.month,
                        students: item.enrollments
                    })
                );

                setData(monthlyData);

            } catch (error) {
                console.error("Enrollment Stats Error:", error);

                setError(
                    error.response?.data?.message ||
                    "Failed to load enrollment statistics"
                );
            } finally {
                setLoading(false);
            }
        };

        fetchEnrollmentStats();
    }, [year]);

    return (
        <div className="chart-card">
            <div className="section-heading">
                <div>
                    <h3>Student Enrollment</h3>
                    <p>Monthly enrollment statistics</p>
                </div>

                <select
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                >
                    <option value={currentYear}>{currentYear}</option>
                    <option value={currentYear - 1}>
                        {currentYear - 1}
                    </option>
                </select>
            </div>

            <div className="chart-container">
                {loading ? (
                    <p>Loading enrollment data...</p>
                ) : error ? (
                    <p>{error}</p>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient
                                    id="enrollmentColor"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                >
                                    <stop
                                        offset="0%"
                                        stopColor="#6366f1"
                                        stopOpacity={0.3}
                                    />
                                    <stop
                                        offset="95%"
                                        stopColor="#6366f1"
                                        stopOpacity={0}
                                    />
                                </linearGradient>
                            </defs>

                            <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                stroke="#e8eaf0"
                            />

                            <XAxis
                                dataKey="month"
                                axisLine={false}
                                tickLine={false}
                            />

                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                allowDecimals={false}
                            />

                            <Tooltip />

                            <Area
                                type="monotone"
                                dataKey="students"
                                name="Enrollments"
                                stroke="#6366f1"
                                strokeWidth={3}
                                fill="url(#enrollmentColor)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}

export default EnrollmentChart;
