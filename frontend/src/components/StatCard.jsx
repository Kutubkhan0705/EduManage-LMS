function StatCard({ title, value, icon: Icon, color }) {
    return (
        <div className="stat-card">
            <div className="stat-top">
                <div className={`stat-icon ${color}`}>
                    <Icon size={23} />
                </div>
            </div>
            <p className="stat-title">{title}</p>
            <h2>{value}</h2>
        </div>
    );
}

export default StatCard;
