module.exports = (sequelize, DataTypes) => {
     const Reliance = sequelize.define(
        `Reliance`,
        {
          id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.BIGINT
          },
          timestamp: {
            type: DataTypes.DATE,
            allowNull: false
          },
          open: {
            type: DataTypes.DECIMAL(12, 4),
            allowNull: false
          },
          high: {
            type: DataTypes.DECIMAL(12, 4),
            allowNull: false
          },
          low: {
            type: DataTypes.DECIMAL(12, 4),
            allowNull: false
          },
          close: {
            type: DataTypes.DECIMAL(12, 4),
            allowNull: false
          },
          volume: {
            type: DataTypes.BIGINT,
            defaultValue: 0
          },
          openInterest: {
            type: DataTypes.INTEGER,
            defaultValue: 0
          }
        },
        {
          timestamps: true,
          paranoid: true,
          updatedAt: "updatedAt",
          createdAt: "createdAt",
          tableName: `Reliance`
        }
      );
  
    return Reliance;
  };