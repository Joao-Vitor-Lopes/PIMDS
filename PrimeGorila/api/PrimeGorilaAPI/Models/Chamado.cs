using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PrimeGorilaAPI.Models
{
    public class Chamado
    {
        [Key]
        public int id_chamado { get; set; }
        public string titulo { get; set; }
        public string descricao { get; set; }
        public DateTime data_abertura { get; set; } = DateTime.Now;
        public string status { get; set; }
        public string prioridade { get; set; }

        [ForeignKey("Usuario")]
        public int usuario_id { get; set; }
    }
}
