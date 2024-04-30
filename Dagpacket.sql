-- Roles de usuarios
CREATE TABLE roles (
    id CHAR(50) PRIMARY KEY,
    name VARCHAR (20) NOT NULL,
    description VARCHAR (200) NOT NULL 
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci

-- Tabla de usuarios
CREATE TABLE users (
    id CHAR(50) PRIMARY KEY NOT NULL,
    name VARCHAR(50) NOT NULL,
    surname VARCHAR(50) NOT NULL,
    phone VARCHAR(20),
    address_id INT (36),
    email VARCHAR(50) NOT NULL,
    balance DECIMAL(10, 2) DEFAULT 0, -- Saldo a favor del cliente
    password VARCHAR (100) NOT NULL,
    pin INT NOT NULL,
    role_id INT (36),
    FOREIGN KEY (address_id) REFERENCES addresses(id),
    FOREIGN KEY (role_id) REFERENCES roles (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Tabla de direcciones
CREATE TABLE addresses (
    id CHAR(50) PRIMARY KEY NOT NULL,
    street VARCHAR(100) NOT NULL,
    city VARCHAR(50) NOT NULL,
    state VARCHAR(50) NOT NULL,
    country VARCHAR(50) NOT NULL,
    zip_code VARCHAR(20) NOT NULL,
    external_number VARCHAR(10) NOT NULL,
    internal_number VARCHAR(10) NOT NULL,
    settlement VARCHAR(50) NOT NULL,
    municipality VARCHAR(50) NOT NULL
) ENGINE=InnoDB DEAFULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci

-- Tabla de franquicias
CREATE TABLE franchise (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR (50) NOT NULL,
    address_id CHAR (36) NOT NULL,
    opening_date TIMESTAMP CURRENT_TIMESTAMP,
    rfc VARCHAR (20) NOT NULL,
    phone VARCHAR (20) NOT NULL,
    email VARCHAR (30) NOT NULL,
    FOREIGN KEY (address_id) REFERENCES addresses(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE sender_addresses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR (50) NOT NULL,
    email VARCHAR (50) NOT NULL,
    phone INT NOT NULL,
    street VARCHAR(100) NOT NULL,
    city VARCHAR(50) NOT NULL,
    state VARCHAR(50) NOT NULL,
    country VARCHAR(50) NOT NULL,
    zip_code VARCHAR(20) NOT NULL,
    municipality VARCHAR(50) NOT NULL,
    external_number VARCHAR(10) NOT NULL,
    internal_number VARCHAR(10) NOT NULL,
    reference VARCHAR VARCHAR (50) NOT NULL,
); ENGINE=InnoDB DEAFULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci

CREATE TABLE recipient_addresses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR (50) NOT NULL,
    email VARCHAR (50) NOT NULL,
    phone INT NOT NULL,
    street VARCHAR(100) NOT NULL,
    city VARCHAR(50) NOT NULL,
    state VARCHAR(50) NOT NULL,
    country VARCHAR(50) NOT NULL,
    zip_code VARCHAR(20) NOT NULL,
    municipality VARCHAR(50) NOT NULL,
    external_number VARCHAR(10) NOT NULL,
    internal_number VARCHAR(10) NOT NULL,    
    reference VARCHAR VARCHAR (50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
); ENGINE=InnoDB DEAFULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci

-- Tabla de pedidos
CREATE TABLE shipments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id INT NOT NULL,
    distribution_at DATETIME,   
    sender_address_id INT NOT NULL,
    recipient_address_id INT NOT NULL,
    driver_id INT NOT NULL,
    id_locker INT NOT NULL,
    selling_price DECIMAL(10, 2),
    pickup_enabled BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (sender_address_id) REFERENCES addresses(id),
    FOREIGN KEY (recipient_address_id) REFERENCES recipient_addresses(id),
    FOREIGN KEY (driver_id) REFERENCES drivers(id),
    FOREIGN KEY (id_locker) REFERENCES lockers(id)
);

-- Tabla de seguimiento de envíos
CREATE TABLE shipping_tracking (
    id INT AUTO_INCREMENT PRIMARY KEY,
    shipment_id INT NOT NULL,
    status VARCHAR(50) NOT NULL,
    date_status TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shipment_id) REFERENCES shipments(id)
); ENGINE=InnoDB DEAFULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci

-- Tabla de historial de envíos
CREATE TABLE shipment_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    shipment_id INT NOT NULL,            
    user_id INT NOT NULL,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shipment_id) REFERENCES shipments(id)
    FOREIGN KEY (user_id) REFERENCES users (id);
);

-- Tabla de empleados
CREATE TABLE employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    surname VARCHAR(50) NOT NULL,
    phone VARCHAR(20),
    address_id INT,    
    achievements TEXT, -- Logros del empleado    
    role_id VARCHAR(50) NOT NULL,
    FOREIGN KEY (address_id) REFERENCES addresses(id),
    FOREIGN KEY (role_id) REFERENCES roles (id)
) ENGINE=InnoDB DEAFULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci

-- Tabla de cotizaciones
CREATE TABLE quotes (
    id INT NOT NULL PRIMARY KEY,
    price INT NOT NULL,
    shipment_id INT NOT NULL,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shipment_id) REFERENCES shipments(id);
); ENGINE=InnoDB DEAFULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- Tabla de conductores
CREATE TABLE drivers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    surname VARCHAR(50) NOT NULL,
    phone VARCHAR(20),
    vehicle_id INT,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
); ENGINE=InnoDB DEAFULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci

-- Tabla de lockers
CREATE TABLE lockers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    locker_number VARCHAR(20) NOT NULL,
    owner_id INT,
    status VARCHAR(20) NOT NULL DEFAULT 'Disponible', -- Nuevo campo para el estado del locker
    FOREIGN KEY (owner_id) REFERENCES partners(id)
); ENGINE=InnoDB DEAFULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci


-- Tabla de cortes de caja
CREATE TABLE cash_registers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    register_date DATE NOT NULL,
    opening_balance DECIMAL(10, 2) NOT NULL,
    closing_balance DECIMAL(10, 2) NOT NULL,
    total_sales DECIMAL(10, 2) NOT NULL,
    total_expenses DECIMAL(10, 2) NOT NULL,
    id_franchise INT NOT NULL,
    notes TEXT
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (id_franchise) REFERENCES franchise (id)
);

-- Tabla de pagos
CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    shipment_id INT NOT NULL,
    user_id INT NOT NULL, 
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status 
    FOREIGN KEY (shipment_id) REFERENCES shipments(id),
    FOREIGN KEY (user_id) REFERENCES users (id)
);

-- Tabla de historial de pagos
CREATE TABLE payment_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    payment_date DATE NOT NULL,
    payment_amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    notes TEXT,
    FOREIGN KEY (client_id) REFERENCES client_directory(id)
);

DELIMITER //

CREATE FUNCTION changeStatus( 
    idsRecords TEXT, 
    newStatus VARCHAR(50) 
) 
RETURNS INT 
BEGIN 
    DECLARE updatedRecords INT; 

-- Actualizar el estado de los registros seleccionados 
    UPDATE registros 
    SET status = newStatus 
    WHERE FIND_IN_SET(id, idsRecords); 

-- Obtener el número de registros actualizados 
    
    SET updatedRecords = ROW_COUNT(); 
    RETURN updatedRecords; 
END//

DELIMITER;


